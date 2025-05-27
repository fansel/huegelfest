import { Activity, type IActivity } from '@/lib/db/models/Activity';
import { ActivityCategory } from '@/lib/db/models/ActivityCategory';
import { ActivityTemplate } from '@/lib/db/models/ActivityTemplate';
import { broadcast } from '@/lib/websocket/broadcast';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { fromZonedTime, format } from 'date-fns-tz';
import { Types } from 'mongoose';
import type { CreateActivityData, UpdateActivityData } from '../types';
import mongoose from 'mongoose';

// Helper function to safely serialize populated documents
function serializeActivity(activity: any) {
  return {
    _id: activity._id?.toString() || '',
    date: activity.date instanceof Date ? activity.date.toISOString() : activity.date,
    startTime: activity.startTime,
    endTime: activity.endTime,
    customName: activity.customName,
    description: activity.description,
    createdBy: activity.createdBy,
    agendaJobId: activity.agendaJobId,
    responsiblePushJobId: activity.responsiblePushJobId,
    createdAt: activity.createdAt instanceof Date ? activity.createdAt.toISOString() : activity.createdAt,
    updatedAt: activity.updatedAt instanceof Date ? activity.updatedAt.toISOString() : activity.updatedAt,
    categoryId: activity.categoryId?._id?.toString() || activity.categoryId?.toString() || '',
    templateId: activity.templateId?._id?.toString() || activity.templateId?.toString(),
    groupId: activity.groupId?._id?.toString() || activity.groupId?.toString(),
    responsibleUsers: activity.responsibleUsers?.map((user: any) => 
      user?._id?.toString() || user?.toString() || user
    ) || [],
  };
}

export async function getAllActivities() {
  const activities = await Activity.find()
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .sort({ date: 1, startTime: 1 })
    .lean();

  return (activities as any[]).map(serializeActivity);
}

export async function getActivitiesByDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get activities for the specific date (ignoring time)
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const activities = await Activity.find({
    date: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .sort({ startTime: 1 })
    .lean();

  return (activities as any[]).map(serializeActivity);
}

export async function getActivitiesByGroup(groupId: string) {
  const activities = await Activity.find({ groupId: new Types.ObjectId(groupId) })
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .populate('responsibleUsers', 'name deviceId')
    .sort({ date: 1, startTime: 1 })
    .lean();

  return (activities as any[]).map(serializeActivity);
}

export async function createActivity(data: CreateActivityData, createdBy: string) {
  if (!data.categoryId) {
    throw new Error('Kategorie ist erforderlich');
  }

  if (!data.startTime) {
    throw new Error('Startzeit ist erforderlich');
  }

  if (!data.templateId && !data.customName) {
    throw new Error('Entweder ein Template oder ein eigener Name muss angegeben werden');
  }

  const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date;

  const activityData = {
    date: dateObj,
    startTime: data.startTime,
    endTime: data.endTime,
    categoryId: new Types.ObjectId(data.categoryId),
    templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
    customName: data.customName,
    description: data.description || '', // Default to empty string if not provided
    groupId: data.groupId ? new Types.ObjectId(data.groupId) : undefined,
    responsibleUsers: data.responsibleUsers?.map(userId => new Types.ObjectId(userId)) || [],
    createdBy,
  };

  const activity = new Activity(activityData);
  await activity.save();

  // Create push notifications if group is assigned and time is specified
  if (activity.groupId && activity.startTime) {
    try {
      await createActivityPushEvents(activity);
    } catch (error) {
      console.error('Failed to create push events for activity:', error);
      // Don't fail the activity creation if push fails
    }
  }

  // Send immediate notification to responsible users
  if (activity.responsibleUsers && activity.responsibleUsers.length > 0) {
    try {
      await sendResponsibleUserNotification(activity);
    } catch (error) {
      console.error('Failed to send responsible user notification:', error);
    }
  }

  // Load populated data for WebSocket broadcast
  const populatedActivity = await Activity.findById(activity._id)
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .populate('responsibleUsers', 'name deviceId')
    .lean();

  if (!populatedActivity) {
    throw new Error('Aktivität konnte nicht geladen werden');
  }

  const broadcastData = serializeActivity(populatedActivity);

  await broadcast('ACTIVITY_CREATED', { 
    type: 'ACTIVITY_CREATED',
    data: broadcastData,
    timestamp: new Date().toISOString()
  });

  return broadcastData;
}

export async function updateActivity(id: string, data: UpdateActivityData) {
  const activity = await Activity.findById(id);
  if (!activity) {
    throw new Error('Aktivität nicht gefunden');
  }

  // Store old values for comparison
  const oldGroupId = activity.groupId?.toString();
  const oldResponsibleUsers = activity.responsibleUsers?.map((userId: any) => userId.toString()) || [];

  // Update fields
  if (data.date !== undefined) {
    activity.date = typeof data.date === 'string' ? new Date(data.date) : data.date;
  }
  if (data.startTime !== undefined) activity.startTime = data.startTime;
  if (data.endTime !== undefined) activity.endTime = data.endTime;
  if (data.categoryId !== undefined) activity.categoryId = new Types.ObjectId(data.categoryId);
  if (data.templateId !== undefined) {
    activity.templateId = data.templateId ? new Types.ObjectId(data.templateId) : undefined;
  }
  if (data.customName !== undefined) activity.customName = data.customName;
  if (data.description !== undefined) activity.description = data.description;
  if (data.groupId !== undefined) {
    activity.groupId = data.groupId ? new Types.ObjectId(data.groupId) : undefined;
  }
  if (data.responsibleUsers !== undefined) {
    activity.responsibleUsers = data.responsibleUsers.map(userId => new Types.ObjectId(userId));
  }

  await activity.save();

  // Handle group change - cancel old push events and create new ones
  const newGroupId = activity.groupId?.toString();
  const newResponsibleUsers = activity.responsibleUsers?.map((userId: any) => userId.toString()) || [];

  if (oldGroupId !== newGroupId || JSON.stringify(oldResponsibleUsers) !== JSON.stringify(newResponsibleUsers)) {
    // Cancel old push events
    if (activity.agendaJobId) {
      try {
        const agenda = (await import('@/lib/pushScheduler/agenda')).default;
        await agenda.cancel({ _id: activity.agendaJobId });
        activity.agendaJobId = undefined;
      } catch (error) {
        console.error('Failed to cancel old push event:', error);
      }
    }

    if (activity.responsiblePushJobId) {
      try {
        const agenda = (await import('@/lib/pushScheduler/agenda')).default;
        await agenda.cancel({ _id: activity.responsiblePushJobId });
        activity.responsiblePushJobId = undefined;
      } catch (error) {
        console.error('Failed to cancel old responsible push event:', error);
      }
    }

    // Create new push events if group and time are set
    if (activity.groupId && activity.startTime) {
      try {
        await createActivityPushEvents(activity);
      } catch (error) {
        console.error('Failed to create new push events:', error);
      }
    }

    // Send immediate notification to new responsible users
    if (activity.responsibleUsers && activity.responsibleUsers.length > 0) {
      try {
        await sendResponsibleUserNotification(activity);
      } catch (error) {
        console.error('Failed to send responsible user notification:', error);
      }
    }

    await activity.save();
  }

  // Load populated data for broadcast
  const populatedActivity = await Activity.findById(activity._id)
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .populate('responsibleUsers', 'name deviceId')
    .lean();

  if (!populatedActivity) {
    throw new Error('Aktivität konnte nicht geladen werden');
  }

  const broadcastData = serializeActivity(populatedActivity);

  await broadcast('ACTIVITY_UPDATED', { 
    type: 'ACTIVITY_UPDATED',
    data: broadcastData,
    timestamp: new Date().toISOString()
  });

  return broadcastData;
}

export async function deleteActivity(id: string) {
  const activity = await Activity.findById(id);
  if (!activity) {
    throw new Error('Aktivität nicht gefunden');
  }

  // Remove push events if they exist
  if (activity.agendaJobId) {
    try {
      const agenda = (await import('@/lib/pushScheduler/agenda')).default;
      await agenda.cancel({ _id: activity.agendaJobId });
    } catch (error) {
      console.error('Failed to cancel push event for activity:', error);
    }
  }

  if (activity.responsiblePushJobId) {
    try {
      const agenda = (await import('@/lib/pushScheduler/agenda')).default;
      await agenda.cancel({ _id: activity.responsiblePushJobId });
    } catch (error) {
      console.error('Failed to cancel responsible push event for activity:', error);
    }
  }

  await activity.deleteOne();
  await broadcast('ACTIVITY_DELETED', { 
    type: 'ACTIVITY_DELETED',
    data: { activityId: id },
    timestamp: new Date().toISOString()
  });

  return { success: true };
}

/**
 * Send immediate reminder for an activity to assigned group
 */
export async function sendActivityReminder(activityId: string) {
  const activity = await Activity.findById(activityId)
    .populate('categoryId', 'name icon')
    .populate('templateId', 'name')
    .populate('groupId', 'name')
    .lean() as any;

  if (!activity) {
    throw new Error('Aktivität nicht gefunden');
  }

  if (!activity.groupId) {
    throw new Error('Aktivität ist keiner Gruppe zugewiesen');
  }

  // Check if activity has started (can only send reminder after start)
  if (activity.startTime) {
    const now = new Date();
    const activityDate = new Date(activity.date);
    const [startHour, startMin] = activity.startTime.split(':').map(Number);
    const startDateTime = new Date(activityDate);
    startDateTime.setHours(startHour, startMin, 0, 0);

    if (now < startDateTime) {
      throw new Error('Erinnerungen können erst gesendet werden, wenn die Aufgabe begonnen hat');
    }
  }

  // Type assertion since we know the data is populated
  const populatedTemplate = activity.templateId;
  const populatedGroup = activity.groupId;

  const activityName = populatedTemplate?.name || activity.customName || 'Unbekannte Aktivität';
  const groupName = populatedGroup?.name || 'Unbekannte Gruppe';

  // Send immediate push notification
  const { webPushService } = await import('@/lib/webpush/webPushService');
  const { Subscriber } = await import('@/lib/db/models/Subscriber');
  const { User } = await import('@/lib/db/models/User');
  
  // First get all users in this group
  const groupUsers = await User.find({
    groupId: populatedGroup._id
  }).select('deviceId');

  const groupDeviceIds = groupUsers.map(user => user.deviceId);
  
  // Then find subscribers for these deviceIds
  const subscribers = await Subscriber.find({
    deviceId: { $in: groupDeviceIds }
  });

  const title = `Erinnerung für Gruppe ${groupName}`;
  const body = `Eure Aufgabe "${activityName}" steht an!`;

  for (const subscriber of subscribers) {
    if (subscriber.endpoint && webPushService.isInitialized()) {
      try {
        await webPushService.sendNotification(subscriber, {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: { 
            type: 'activity-reminder', 
            activityId: activity._id.toString(),
            groupId: populatedGroup._id.toString()
          }
        });
      } catch (error) {
        console.error('Failed to send push notification to subscriber:', error);
      }
    }
  }

  return { success: true, sent: subscribers.length };
}

/**
 * Send immediate notification to responsible users when they are assigned
 */
async function sendResponsibleUserNotification(activity: any) {
  if (!activity.responsibleUsers || activity.responsibleUsers.length === 0) return;

  const { webPushService } = await import('@/lib/webpush/webPushService');
  const { Subscriber } = await import('@/lib/db/models/Subscriber');
  const { User } = await import('@/lib/db/models/User');
  const { Group } = await import('@/lib/db/models/Group');

  // Get group information
  const group = await Group.findById(activity.groupId).select('name');
  const groupName = group?.name || 'Unbekannte Gruppe';

  // Get responsible users
  const responsibleUsers = await User.find({
    _id: { $in: activity.responsibleUsers }
  }).select('deviceId name');

  const responsibleDeviceIds = responsibleUsers.map(user => user.deviceId);
  
  // Find subscribers for these deviceIds
  const subscribers = await Subscriber.find({
    deviceId: { $in: responsibleDeviceIds }
  });

  // Format date with day of week and time
  const activityDate = new Date(activity.date);
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dayName = dayNames[activityDate.getDay()];
  
  const activityName = activity.customName || 'Aktivität';
  const timeText = activity.startTime ? ` um ${activity.startTime}` : '';
  
  const title = `Gruppe ${groupName}`;
  const body = `Du trägst die Hauptverantwortung für Aufgabe "${activityName}" am ${dayName}${timeText}`;

  for (const subscriber of subscribers) {
    if (subscriber.endpoint && webPushService.isInitialized()) {
      try {
        await webPushService.sendNotification(subscriber, {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: { 
            type: 'responsible-assignment', 
            activityId: activity._id.toString()
          }
        });
      } catch (error) {
        console.error('Failed to send responsible user notification:', error);
      }
    }
  }
}

/**
 * Helper function to create push events for activity
 */
async function createActivityPushEvents(activity: any) {
  if (!activity.startTime || !activity.groupId) return;

  // Parse time and create notification date
  const [hours, minutes] = activity.startTime.split(':').map(Number);

  const activityDate = new Date(activity.date);
  activityDate.setHours(hours, minutes, 0, 0);

  // Convert to Berlin timezone
  const berlinDate = fromZonedTime(activityDate, 'Europe/Berlin');

  const activityName = activity.customName || 'Aktivität';
  
  // Get group information for group name
  const { Group } = await import('@/lib/db/models/Group');
  const group = await Group.findById(activity.groupId).select('name');
  const groupName = group?.name || 'Unbekannte Gruppe';
  
  // Get all subscribers of the group
  const { Subscriber } = await import('@/lib/db/models/Subscriber');
  const { User } = await import('@/lib/db/models/User');
  
  // First get all users in this group
  const groupUsers = await User.find({
    groupId: activity.groupId
  }).select('deviceId');

  const groupDeviceIds = groupUsers.map(user => user.deviceId);
  
  // Then find subscribers for these deviceIds
  const groupSubscribers = await Subscriber.find({
    deviceId: { $in: groupDeviceIds }
  }).select('_id');

  // Get responsible users if any
  let responsibleDeviceIds: string[] = [];
  let responsibleSubscriberIds: mongoose.Types.ObjectId[] = [];
  
  if (activity.responsibleUsers && activity.responsibleUsers.length > 0) {
    // Get deviceIds of responsible users
    const responsibleUsers = await User.find({
      _id: { $in: activity.responsibleUsers }
    }).select('deviceId');

    responsibleDeviceIds = responsibleUsers.map(user => user.deviceId);
    
    // Find subscribers with these deviceIds
    const responsibleSubscribers = await Subscriber.find({
      deviceId: { $in: responsibleDeviceIds }
    }).select('_id');

    responsibleSubscriberIds = responsibleSubscribers.map(sub => sub._id) as mongoose.Types.ObjectId[];
  }

  // Separate notifications for responsible users and general group members
  const generalGroupSubscribers = groupSubscribers.filter(sub => {
    // Only include subscribers who are NOT responsible users
    return !responsibleSubscriberIds.some(respId => respId.equals(sub._id as mongoose.Types.ObjectId));
  });

  const generalSubscriberIds = generalGroupSubscribers.map(sub => sub._id) as mongoose.Types.ObjectId[];
  
  // Scheduled notification for general group members
  if (generalSubscriberIds.length > 0) {
    const pushEvent = await createScheduledPushEvent({
      title: `Gruppe ${groupName}`,
      body: `Eure Aufgabe "${activityName}" hat begonnen`,
      repeat: 'once',
      schedule: berlinDate,
      active: true,
      sendToAll: false,
      subscribers: generalSubscriberIds,
    });

    // Update activity with agenda job ID
    activity.agendaJobId = pushEvent.agendaJobId;
  }

  // Scheduled notification for responsible users (with additional responsibility note)
  if (responsibleSubscriberIds.length > 0) {
    const responsiblePushEvent = await createScheduledPushEvent({
      title: `Gruppe ${groupName}`,
      body: `Eure Aufgabe "${activityName}" hat begonnen - Du trägst die Hauptverantwortung!`,
      repeat: 'once',
      schedule: berlinDate,
      active: true,
      sendToAll: false,
      subscribers: responsibleSubscriberIds,
    });

    activity.responsiblePushJobId = responsiblePushEvent.agendaJobId;
  }

  await activity.save();

  return activity.agendaJobId;
} 