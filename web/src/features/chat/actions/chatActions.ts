'use server';

import { 
  getActivityChatMessages, 
  getGroupChatMessages, 
  sendActivityChatMessage, 
  sendGroupChatMessage, 
  hasActivityChatMessages,
  getGroupChatActivity,
  type CreateChatMessageData,
  type ChatMessageResponse
} from '../services/chatService';
import { verifySession } from '@/features/auth/actions/userAuth';
import { connectDB } from '@/lib/db/connector';
import { Activity } from '@/lib/db/models/Activity';
import { User } from '@/lib/db/models/User';
import { Group } from '@/lib/db/models/Group';
import { Types } from 'mongoose';

// Re-export for use in components
export type { ChatMessageResponse };

export interface ActivityDetails {
  _id: string;
  customName?: string;
  groupId?: string;
  groupName?: string;
  responsibleUsers: Array<{
    _id: string;
    name: string;
  }>;
}

export interface GroupMember {
  _id: string;
  name: string;
}

/**
 * Get chat messages for an activity
 */
export async function getActivityChatAction(activityId: string): Promise<{
  success: boolean;
  messages?: ChatMessageResponse[];
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const messages = await getActivityChatMessages(activityId);
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting activity chat:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Get chat messages for a group
 */
export async function getGroupChatAction(groupId: string): Promise<{
  success: boolean;
  messages?: ChatMessageResponse[];
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Check if user has access to this group chat
    await connectDB();
    
    // Debug: Log the received groupId
    console.log('[getGroupChatAction] Received groupId:', groupId, 'Type:', typeof groupId);
    
    // Check if groupId is provided and not empty
    if (!groupId || groupId.trim() === '') {
      return { success: false, error: 'Keine Gruppen-ID angegeben' };
    }
    
    // Check if groupId is a valid ObjectId
    if (!Types.ObjectId.isValid(groupId)) {
      console.error('[getGroupChatAction] Invalid ObjectId:', groupId);
      return { success: false, error: 'Ungültige Gruppen-ID Format' };
    }

    if (sessionData.role === 'user') {
      // Regular users can only access their own group chat
      const user = await User.findById(sessionData.userId).select('groupId').lean();
      if (!user || user.groupId?.toString() !== groupId) {
        return { success: false, error: 'Kein Zugriff auf diesen Gruppenchat' };
      }
    } else if (sessionData.role === 'admin') {
      // Admins can only access group chat if they are also a member of that group
      const admin = await User.findById(sessionData.userId).select('groupId').lean();
      if (!admin || admin.groupId?.toString() !== groupId) {
        return { success: false, error: 'Kein Zugriff auf diesen Gruppenchat - nur Gruppenmitglieder haben Zugang' };
      }
    }

    const messages = await getGroupChatMessages(groupId);
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting group chat:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Send a message to an activity chat
 */
export async function sendActivityChatAction(data: {
  content: string;
  activityId: string;
}): Promise<{
  success: boolean;
  message?: ChatMessageResponse;
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const messageData: CreateChatMessageData = {
      content: data.content,
      userId: sessionData.userId,
      userName: sessionData.name || 'Unbekannter Benutzer',
      activityId: data.activityId,
      isAdminMessage: sessionData.role === 'admin',
    };

    const message = await sendActivityChatMessage(messageData);
    return { success: true, message };
  } catch (error) {
    console.error('Error sending activity chat message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Send a message to a group chat
 */
export async function sendGroupChatAction(data: {
  content: string;
  groupId: string;
}): Promise<{
  success: boolean;
  message?: ChatMessageResponse;
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    // Check if user has access to this group chat
    // Users can only access their own group chat, admins can access if they are group members
    await connectDB();
    
    // Debug: Log the received groupId
    console.log('[sendGroupChatAction] Received groupId:', data.groupId, 'Type:', typeof data.groupId);
    
    // Check if groupId is provided and not empty
    if (!data.groupId || data.groupId.trim() === '') {
      return { success: false, error: 'Keine Gruppen-ID angegeben' };
    }
    
    // Check if groupId is a valid ObjectId
    if (!Types.ObjectId.isValid(data.groupId)) {
      console.error('[sendGroupChatAction] Invalid ObjectId:', data.groupId);
      return { success: false, error: 'Ungültige Gruppen-ID Format' };
    }

    if (sessionData.role === 'user') {
      // Regular users can only access their own group chat
      const user = await User.findById(sessionData.userId).select('groupId').lean();
      if (!user || user.groupId?.toString() !== data.groupId) {
        return { success: false, error: 'Kein Zugriff auf diesen Gruppenchat' };
      }
    } else if (sessionData.role === 'admin') {
      // Admins can only access group chat if they are also a member of that group
      const admin = await User.findById(sessionData.userId).select('groupId').lean();
      if (!admin || admin.groupId?.toString() !== data.groupId) {
        return { success: false, error: 'Kein Zugriff auf diesen Gruppenchat - nur Gruppenmitglieder haben Zugang' };
      }
    }

    const messageData: CreateChatMessageData = {
      content: data.content,
      userId: sessionData.userId,
      userName: sessionData.name || 'Unbekannter Benutzer',
      groupId: data.groupId,
      isAdminMessage: sessionData.role === 'admin',
    };

    const message = await sendGroupChatMessage(messageData);
    return { success: true, message };
  } catch (error) {
    console.error('Error sending group chat message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Check if an activity has chat messages (for showing chat icon)
 */
export async function checkActivityChatAction(activityId: string): Promise<{
  success: boolean;
  hasMessages?: boolean;
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const hasMessages = await hasActivityChatMessages(activityId);
    return { success: true, hasMessages };
  } catch (error) {
    console.error('Error checking activity chat:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Get group chat activity (for overview)
 */
export async function getGroupChatActivityAction(groupId: string): Promise<{
  success: boolean;
  activity?: {
    totalMessages: number;
    lastMessage: ChatMessageResponse | null;
  };
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    const activity = await getGroupChatActivity(groupId);
    return { success: true, activity };
  } catch (error) {
    console.error('Error getting group chat activity:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Get activity details with responsible users for chat
 */
export async function getActivityDetailsAction(activityId: string): Promise<{
  success: boolean;
  activity?: {
    _id: string;
    customName?: string;
    groupId?: string;
    groupName?: string;
    responsibleUsers: Array<{
      _id: string;
      name: string;
    }>;
  };
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    await connectDB();

    // Validate activityId before using it
    if (!Types.ObjectId.isValid(activityId)) {
      return { success: false, error: 'Ungültige Aktivitäts-ID' };
    }

    const activity = await Activity.findById(new Types.ObjectId(activityId))
      .populate('groupId', 'name')
      .populate('responsibleUsers', 'name')
      .lean() as any;

    if (!activity) {
      return { success: false, error: 'Aktivität nicht gefunden' };
    }

    return {
      success: true,
      activity: {
        _id: activity._id.toString(),
        customName: activity.customName,
        groupId: activity.groupId?._id?.toString(),
        groupName: activity.groupId?.name,
        responsibleUsers: (activity.responsibleUsers || []).map((user: any) => ({
          _id: user._id.toString(),
          name: user.name
        }))
      }
    };
  } catch (error) {
    console.error('Error getting activity details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
}

/**
 * Get group members for group info
 */
export async function getGroupMembersAction(groupId: string): Promise<{
  success: boolean;
  members?: Array<{
    _id: string;
    name: string;
  }>;
  groupName?: string;
  error?: string;
}> {
  try {
    const sessionData = await verifySession();
    if (!sessionData) {
      return { success: false, error: 'Nicht authentifiziert' };
    }

    await connectDB();

    // Debug: Log the received groupId
    console.log('[getGroupMembersAction] Received groupId:', groupId, 'Type:', typeof groupId);
    
    // Check if groupId is provided and not empty
    if (!groupId || groupId.trim() === '') {
      return { success: false, error: 'Keine Gruppen-ID angegeben' };
    }

    // Validate groupId before using it
    if (!Types.ObjectId.isValid(groupId)) {
      console.error('[getGroupMembersAction] Invalid ObjectId:', groupId);
      return { success: false, error: 'Ungültige Gruppen-ID Format' };
    }

    // Check if user has access to this group's member list
    if (sessionData.role === 'user') {
      // Regular users can only see their own group's members
      const user = await User.findById(sessionData.userId).select('groupId').lean();
      if (!user || user.groupId?.toString() !== groupId) {
        return { success: false, error: 'Kein Zugriff auf diese Gruppenmitglieder' };
      }
    } else if (sessionData.role === 'admin') {
      // Admins can only see group members if they are also a member of that group
      const admin = await User.findById(sessionData.userId).select('groupId').lean();
      if (!admin || admin.groupId?.toString() !== groupId) {
        return { success: false, error: 'Kein Zugriff auf diese Gruppenmitglieder - nur Gruppenmitglieder haben Zugang' };
      }
    }

    const group = await Group.findById(new Types.ObjectId(groupId)).select('name').lean();
    if (!group) {
      return { success: false, error: 'Gruppe nicht gefunden' };
    }

    const members = await User.find({ groupId: new Types.ObjectId(groupId) })
      .select('name')
      .lean();

    return {
      success: true,
      groupName: group.name,
      members: members.map(member => ({
        _id: member._id.toString(),
        name: member.name
      }))
    };
  } catch (error) {
    console.error('Error getting group members:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    };
  }
} 