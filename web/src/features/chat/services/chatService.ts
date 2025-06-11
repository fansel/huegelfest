import { ChatMessage, type IChatMessage } from '@/lib/db/models/ChatMessage';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { Activity } from '@/lib/db/models/Activity';
import { broadcast } from '@/lib/websocket/broadcast';
import { Types } from 'mongoose';

export interface CreateChatMessageData {
  content: string;
  userId: string;
  userName?: string; // Optional, will be fetched if not provided
  activityId?: string; // For activity chats
  groupId?: string; // For group chats
  isAdminMessage?: boolean;
}

export interface ChatMessageResponse {
  _id: string;
  content: string;
  userId: string;
  userName: string;
  activityId?: string;
  groupId?: string;
  messageType: string;
  isAdminMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to serialize chat messages
function serializeChatMessage(message: any): ChatMessageResponse {
  return {
    _id: message._id?.toString() || '',
    content: message.content,
    userId: message.userId?.toString() || '',
    userName: message.userName,
    activityId: message.activityId?.toString(),
    groupId: message.groupId?.toString(),
    messageType: message.messageType || 'text',
    isAdminMessage: message.isAdminMessage || false,
    createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
    updatedAt: message.updatedAt instanceof Date ? message.updatedAt.toISOString() : message.updatedAt,
  };
}

/**
 * Get messages for an activity chat
 */
export async function getActivityChatMessages(activityId: string, limit: number = 50) {
  if (!Types.ObjectId.isValid(activityId)) {
    throw new Error('Ungültige Aktivitäts-ID');
  }

  const messages = await ChatMessage.find({ activityId: new Types.ObjectId(activityId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map(serializeChatMessage); // Reverse to show oldest first
}

/**
 * Get messages for a group chat
 */
export async function getGroupChatMessages(groupId: string, limit: number = 50) {
  if (!Types.ObjectId.isValid(groupId)) {
    throw new Error('Ungültige Gruppen-ID');
  }

  const messages = await ChatMessage.find({ groupId: new Types.ObjectId(groupId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map(serializeChatMessage); // Reverse to show oldest first
}

/**
 * Send a message to an activity chat
 * Activity chat includes: all group members + all admins who have responded
 */
export async function sendActivityChatMessage(data: CreateChatMessageData) {
  if (!data.activityId) {
    throw new Error('ActivityId ist erforderlich für Aktivitäts-Chat');
  }

  if (!Types.ObjectId.isValid(data.activityId)) {
    throw new Error('Ungültige Aktivitäts-ID');
  }

  // Verify activity exists
  const activity = await Activity.findById(data.activityId).populate('groupId', 'name');
  if (!activity) {
    throw new Error('Aktivität nicht gefunden');
  }

  // Get user info if not provided
  let userName = data.userName;
  if (!userName) {
    const user = await User.findById(data.userId).select('name');
    userName = user?.name || 'Unbekannter Benutzer';
  }

  // Create message
  const message = new ChatMessage({
    content: data.content,
    userId: new Types.ObjectId(data.userId),
    userName,
    activityId: new Types.ObjectId(data.activityId),
    messageType: 'text',
    isAdminMessage: data.isAdminMessage || false,
  });

  await message.save();

  // Update the activity's lastMessageAt field
  await Activity.findByIdAndUpdate(data.activityId, {
    lastMessageAt: new Date(),
  });

  const serializedMessage = serializeChatMessage(message);

  // Broadcast to all connected clients
  await broadcast('ACTIVITY_CHAT_MESSAGE', {
    type: 'ACTIVITY_CHAT_MESSAGE',
    data: {
      activityId: data.activityId,
      message: serializedMessage,
    },
    timestamp: new Date().toISOString(),
  });

  // Send push notifications to group members + admins who have participated
  if (activity.groupId) {
    // Extract the actual groupId string from populated object or use toString()
    const groupIdString = typeof activity.groupId === 'string' 
      ? activity.groupId 
      : (activity.groupId as any)._id?.toString() || activity.groupId.toString();
      
    await sendActivityChatPushNotification({
      activityId: data.activityId,
      groupId: groupIdString,
      senderName: userName,
      message: data.content,
      excludeUserId: data.userId,
    });
  }

  return serializedMessage;
}

/**
 * Send a message to a group chat (only for users, not admins unless they are group members)
 */
export async function sendGroupChatMessage(data: CreateChatMessageData) {
  if (!data.groupId) {
    throw new Error('GroupId ist erforderlich für Gruppen-Chat');
  }

  if (!Types.ObjectId.isValid(data.groupId)) {
    throw new Error('Ungültige Gruppen-ID');
  }

  // Verify group exists
  const group = await Group.findById(data.groupId);
  if (!group) {
    throw new Error('Gruppe nicht gefunden');
  }

  // Get user info if not provided
  let userName = data.userName;
  if (!userName) {
    const user = await User.findById(data.userId).select('name');
    userName = user?.name || 'Unbekannter Benutzer';
  }

  // Create message
  const message = new ChatMessage({
    content: data.content,
    userId: new Types.ObjectId(data.userId),
    userName,
    groupId: new Types.ObjectId(data.groupId),
    messageType: 'text',
    isAdminMessage: data.isAdminMessage || false,
  });

  await message.save();

  const serializedMessage = serializeChatMessage(message);

  // Broadcast to all connected clients
  await broadcast('GROUP_CHAT_MESSAGE', {
    type: 'GROUP_CHAT_MESSAGE',
    data: {
      groupId: data.groupId,
      message: serializedMessage,
    },
    timestamp: new Date().toISOString(),
  });

  // Send push notifications to group members only (no admins unless they are group members)
  await sendGroupChatPushNotification({
    groupId: data.groupId,
    senderName: userName,
    message: data.content,
    excludeUserId: data.userId,
  });

  return serializedMessage;
}

/**
 * Send push notifications for new activity chat messages
 * Includes: group members + admins who have participated in this activity chat
 */
async function sendActivityChatPushNotification({
  activityId,
  groupId,
  senderName,
  message,
  excludeUserId,
}: {
  activityId: string;
  groupId: string;
  senderName: string;
  message: string;
  excludeUserId: string;
}) {
  try {
    const { createScheduledPushEvent } = await import('@/features/pushScheduler/scheduledPushEventService');
    
    if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(activityId)) {
      console.error('Invalid groupId or activityId for push notification:', { groupId, activityId });
      return;
    }
    
    // Get the activity and convert to a plain object to bypass linter issues
    const activityData = await Activity.findById(activityId).select('createdBy responsibleUsers customName').lean();
    if (!activityData) {
      console.error('Activity not found for push notification:', activityId);
      return;
    }
    const activity = JSON.parse(JSON.stringify(activityData));
    
    // Get all users in the group
    const groupUsers = await User.find({
      groupId: new Types.ObjectId(groupId)
    }).select('_id').lean();

    // Get all admins who have participated in this activity chat
    const adminParticipants = await ChatMessage.distinct('userId', {
      activityId: new Types.ObjectId(activityId),
      isAdminMessage: true,
    });

    // Combine all potential recipients
    const allRecipients = new Set<string>();
    
    // 1. All group members
    groupUsers.forEach((user: any) => allRecipients.add(user._id.toString()));
    
    // 2. All responsible users
    if (activity.responsibleUsers && Array.isArray(activity.responsibleUsers)) {
      activity.responsibleUsers.forEach((userId: any) => allRecipients.add(userId.toString()));
    }
    
    // 3. The activity creator (if they exist)
    if (activity.createdBy) {
      allRecipients.add(activity.createdBy.toString());
    }
    
    // 4. All admin participants
    adminParticipants.forEach((adminId: any) => allRecipients.add(adminId.toString()));

    // Finally, remove the original sender from the set
    allRecipients.delete(excludeUserId);

    const title = `Aufgabe: ${activity.customName || 'Neue Nachricht'}`;
    const body = `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`;

    for (const userId of allRecipients) {
      try {
        await createScheduledPushEvent({
          title,
          body,
          repeat: 'once',
          schedule: new Date(),
          active: true,
          type: 'user',
          targetUserId: userId,
          data: {
            type: 'activity-chat',
            groupId,
            activityId,
            senderId: excludeUserId,
            senderName,
          }
        });
      } catch (error) {
        console.error('Failed to schedule activity chat push notification for user:', userId, error);
      }
    }
  } catch (error) {
    console.error('Failed to schedule activity chat push notifications:', error);
  }
}

/**
 * Send push notifications for new group chat messages
 * Only for group members (users only, no admins unless they are group members)
 */
async function sendGroupChatPushNotification({
  groupId,
  senderName,
  message,
  excludeUserId,
}: {
  groupId: string;
  senderName: string;
  message: string;
  excludeUserId: string;
}) {
  try {
    const { createScheduledPushEvent } = await import('@/features/pushScheduler/scheduledPushEventService');
    
    if (!Types.ObjectId.isValid(groupId)) {
      console.error('Invalid groupId for push notification:', groupId);
      return;
    }

    // Get all users in the group (except sender) - only group members
    const groupUsers = await User.find({
      groupId: new Types.ObjectId(groupId),
      _id: { $ne: new Types.ObjectId(excludeUserId) }
    }).select('_id').lean();

    const title = 'Neue Gruppennachricht';
    const body = `${senderName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`;

    for (const user of groupUsers) {
      try {
        await createScheduledPushEvent({
          title,
          body,
          repeat: 'once',
          schedule: new Date(),
          active: true,
          type: 'user',
          targetUserId: user._id.toString(),
          data: {
            type: 'group-chat',
            groupId,
            senderId: excludeUserId,
            senderName,
          }
        });
      } catch (error) {
        console.error('Failed to schedule group chat push notification for user:', user._id, error);
      }
    }
  } catch (error) {
    console.error('Failed to schedule group chat push notifications:', error);
  }
}

/**
 * Get recent activity for a group (for chat overview)
 */
export async function getGroupChatActivity(groupId: string) {
  if (!Types.ObjectId.isValid(groupId)) {
    throw new Error('Ungültige Gruppen-ID');
  }

  const recentMessages = await ChatMessage.find({ groupId: new Types.ObjectId(groupId) })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const totalMessages = await ChatMessage.countDocuments({ groupId: new Types.ObjectId(groupId) });

  return {
    totalMessages,
    lastMessage: recentMessages.length > 0 ? serializeChatMessage(recentMessages[0]) : null,
  };
}

/**
 * Check if activity has any chat messages
 */
export async function hasActivityChatMessages(activityId: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(activityId)) {
    return false;
  }
  
  const count = await ChatMessage.countDocuments({ activityId: new Types.ObjectId(activityId) });
  return count > 0;
} 