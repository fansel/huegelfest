import { Activity } from '@/lib/db/models/Activity';
import { ActivityCategory } from '@/lib/db/models/ActivityCategory';
import { ActivityTemplate } from '@/lib/db/models/ActivityTemplate';
import { broadcast } from '@/lib/websocket/broadcast';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { fromZonedTime, format } from 'date-fns-tz';
import { Types } from 'mongoose';
import type { CreateActivityData, UpdateActivityData } from '../types';
import mongoose from 'mongoose';

export async function getAllActivities() {
  const activities = await Activity.find()
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .sort({ date: 1, time: 1 })
    .lean();

  return activities.map(activity => ({
    ...activity,
    _id: activity._id.toString(),
    categoryId: activity.categoryId.toString(),
    templateId: activity.templateId?.toString(),
    groupId: activity.groupId?.toString(),
  }));
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
    .sort({ time: 1 })
    .lean();

  return activities.map(activity => ({
    ...activity,
    _id: activity._id.toString(),
    categoryId: activity.categoryId.toString(),
    templateId: activity.templateId?.toString(),
    groupId: activity.groupId?.toString(),
  }));
}

export async function getActivitiesByGroup(groupId: string) {
  const activities = await Activity.find({ groupId })
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .sort({ date: 1, time: 1 })
    .lean();

  return activities.map(activity => ({
    ...activity,
    _id: activity._id.toString(),
    categoryId: activity.categoryId.toString(),
    templateId: activity.templateId?.toString(),
    groupId: activity.groupId?.toString(),
  }));
}

export async function createActivity(data: CreateActivityData, createdBy: string) {
  if (!data.categoryId) {
    throw new Error('Kategorie ist erforderlich');
  }

  if (!data.templateId && !data.customName) {
    throw new Error('Entweder ein Template oder ein eigener Name muss angegeben werden');
  }

  const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date;

  const activityData = {
    date: dateObj,
    time: data.time,
    categoryId: new Types.ObjectId(data.categoryId),
    templateId: data.templateId ? new Types.ObjectId(data.templateId) : undefined,
    customName: data.customName,
    description: data.description,
    groupId: data.groupId ? new Types.ObjectId(data.groupId) : undefined,
    responsibleUsers: data.responsibleUsers?.map(userId => new Types.ObjectId(userId)) || [],
    createdBy,
  };

  const activity = new Activity(activityData);
  await activity.save();

  // Create push notification if group is assigned and time is specified
  if (activity.groupId && activity.time) {
    try {
      await createActivityPushEvent(activity);
    } catch (error) {
      console.error('Failed to create push event for activity:', error);
      // Don't fail the activity creation if push fails
    }
  }

  // Load populated data for WebSocket broadcast
  const populatedActivity = await Activity.findById(activity._id)
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .populate('responsibleUsers', 'name deviceId')
    .lean();

  // Sichere Serialisierung der populated Objects
  const category = populatedActivity!.categoryId as any;
  const template = populatedActivity!.templateId as any;
  const group = populatedActivity!.groupId as any;
  const responsibleUsers = populatedActivity!.responsibleUsers as any[];

  const broadcastData = {
    _id: populatedActivity!._id.toString(),
    date: populatedActivity!.date instanceof Date ? populatedActivity!.date.toISOString() : populatedActivity!.date,
    time: populatedActivity!.time,
    customName: populatedActivity!.customName,
    description: populatedActivity!.description,
    createdBy: populatedActivity!.createdBy,
    agendaJobId: populatedActivity!.agendaJobId,
    createdAt: populatedActivity!.createdAt instanceof Date ? populatedActivity!.createdAt.toISOString() : populatedActivity!.createdAt,
    updatedAt: populatedActivity!.updatedAt instanceof Date ? populatedActivity!.updatedAt.toISOString() : populatedActivity!.updatedAt,
    
    // IDs als Strings - nicht die populated Objects
    categoryId: category?._id?.toString() || populatedActivity!.categoryId.toString(),
    templateId: template?._id?.toString() || (populatedActivity!.templateId ? populatedActivity!.templateId.toString() : undefined),
    groupId: group?._id?.toString() || (populatedActivity!.groupId ? populatedActivity!.groupId.toString() : undefined),
    responsibleUsers: responsibleUsers?.map(user => user?._id?.toString()) || [],
  };

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

  const oldGroupId = activity.groupId?.toString();
  const oldTime = activity.time;

  // Update fields
  if (data.date !== undefined) {
    activity.date = typeof data.date === 'string' ? new Date(data.date) : data.date;
  }
  if (data.time !== undefined) activity.time = data.time;
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

  // Update push notification if needed
  const newGroupId = activity.groupId?.toString();
  const newTime = activity.time;

  if ((oldGroupId !== newGroupId) || (oldTime !== newTime)) {
    try {
      // Remove old push event if exists
      if (activity.agendaJobId) {
        const agenda = (await import('@/lib/pushScheduler/agenda')).default;
        await agenda.cancel({ _id: activity.agendaJobId });
        activity.agendaJobId = undefined;
      }

      // Create new push event if group and time are assigned
      if (activity.groupId && activity.time) {
        await createActivityPushEvent(activity);
      }
    } catch (error) {
      console.error('Failed to update push event for activity:', error);
    }
  }

  // Load populated data for WebSocket broadcast
  const populatedActivity = await Activity.findById(activity._id)
    .populate('categoryId', 'name icon color')
    .populate('templateId', 'name defaultDescription')
    .populate('groupId', 'name color')
    .populate('responsibleUsers', 'name deviceId')
    .lean();

  // Sichere Serialisierung der populated Objects
  const category = populatedActivity!.categoryId as any;
  const template = populatedActivity!.templateId as any;
  const group = populatedActivity!.groupId as any;
  const responsibleUsers = populatedActivity!.responsibleUsers as any[];

  const broadcastData = {
    _id: populatedActivity!._id.toString(),
    date: populatedActivity!.date instanceof Date ? populatedActivity!.date.toISOString() : populatedActivity!.date,
    time: populatedActivity!.time,
    customName: populatedActivity!.customName,
    description: populatedActivity!.description,
    createdBy: populatedActivity!.createdBy,
    agendaJobId: populatedActivity!.agendaJobId,
    createdAt: populatedActivity!.createdAt instanceof Date ? populatedActivity!.createdAt.toISOString() : populatedActivity!.createdAt,
    updatedAt: populatedActivity!.updatedAt instanceof Date ? populatedActivity!.updatedAt.toISOString() : populatedActivity!.updatedAt,
    
    // IDs als Strings - nicht die populated Objects
    categoryId: category?._id?.toString() || populatedActivity!.categoryId.toString(),
    templateId: template?._id?.toString() || (populatedActivity!.templateId ? populatedActivity!.templateId.toString() : undefined),
    groupId: group?._id?.toString() || (populatedActivity!.groupId ? populatedActivity!.groupId.toString() : undefined),
    responsibleUsers: responsibleUsers?.map(user => user?._id?.toString()) || [],
  };

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

  // Remove push event if exists
  if (activity.agendaJobId) {
    try {
      const agenda = (await import('@/lib/pushScheduler/agenda')).default;
      await agenda.cancel({ _id: activity.agendaJobId });
    } catch (error) {
      console.error('Failed to cancel push event for activity:', error);
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
    .lean();

  if (!activity) {
    throw new Error('Aktivität nicht gefunden');
  }

  if (!activity.groupId) {
    throw new Error('Aktivität ist keiner Gruppe zugewiesen');
  }

  // Type assertion since we know the data is populated
  const populatedTemplate = activity.templateId as any;
  const populatedGroup = activity.groupId as any;

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
 * Helper function to create push event for activity
 */
async function createActivityPushEvent(activity: any) {
  if (!activity.time || !activity.groupId) return;

  // Parse time and create notification date
  const timePart = activity.time.split('-')[0]; // Get start time from "08:00-10:00" or just "08:00"
  const [hours, minutes] = timePart.split(':').map(Number);

  const activityDate = new Date(activity.date);
  activityDate.setHours(hours, minutes, 0, 0);

  // Convert to Berlin timezone
  const berlinDate = fromZonedTime(activityDate, 'Europe/Berlin');

  const activityName = activity.templateId?.name || activity.customName || 'Aktivität';
  
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

  const subscriberIds = groupSubscribers.map(sub => sub._id) as mongoose.Types.ObjectId[];
  
  // Standard push notification for all group members
  const pushEvent = await createScheduledPushEvent({
    title: 'Eure Aufgabe startet!',
    body: `"${activityName}" beginnt jetzt!`,
    repeat: 'once',
    schedule: berlinDate,
    active: true,
    sendToAll: false,
    subscribers: subscriberIds,
  });

  // Special push notification for responsible users
  if (activity.responsibleUsers && activity.responsibleUsers.length > 0) {
    // Get deviceIds of responsible users
    const responsibleUsers = await User.find({
      _id: { $in: activity.responsibleUsers }
    }).select('deviceId');

    const responsibleDeviceIds = responsibleUsers.map(user => user.deviceId);
    
    // Find subscribers with these deviceIds
    const responsibleSubscribers = await Subscriber.find({
      deviceId: { $in: responsibleDeviceIds }
    }).select('_id');

    if (responsibleSubscribers.length > 0) {
      const responsibleSubscriberIds = responsibleSubscribers.map(sub => sub._id) as mongoose.Types.ObjectId[];
      
      // Create additional push event for responsible users (5 minutes earlier)
      await createScheduledPushEvent({
        title: 'Du trägst Hauptverantwortung!',
        body: `"${activityName}" - Du bist hauptverantwortlich für diese Aufgabe!`,
        repeat: 'once',
        schedule: new Date(berlinDate.getTime() - 5 * 60 * 1000), // 5 Minuten früher
        active: true,
        sendToAll: false,
        subscribers: responsibleSubscriberIds,
      });
    }
  }

  // Update activity with agenda job ID
  activity.agendaJobId = pushEvent.agendaJobId;
  await activity.save();

  return pushEvent;
} 