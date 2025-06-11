'use server';

import { Activity } from '@/lib/db/models/Activity';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';
import { getCurrentUserWithRegistration } from '@/features/auth/services/userService';
import type { ActivityWithCategoryAndTemplate, UserStatus } from '../types';
import { ActivityCategory } from '@/lib/db/models/ActivityCategory';
import { ActivityTemplate } from '@/lib/db/models/ActivityTemplate';
import { Group } from '@/lib/db/models/Group';
import { User } from '@/lib/db/models/User';
import { verifySession } from '@/features/auth/actions/userAuth';

export interface UserActivitiesData {
  activities: ActivityWithCategoryAndTemplate[];
  userStatus: UserStatus;
}

/**
 * Server Action: Lädt alle Aufgaben für den aktuell eingeloggten Benutzer
 * SICHERHEIT: userId wird aus der Session extrahiert, nicht vom Client gesendet
 */
export async function fetchUserActivitiesAction(): Promise<UserActivitiesData> {
  try {
    // Session validieren und userId extrahieren
    const sessionData = await verifySession();
    if (!sessionData) {
      return {
        activities: [],
        userStatus: {
          isRegistered: false,
          name: undefined,
          groupId: undefined,
          groupName: undefined,
          groupColor: undefined,
        } as UserStatus
      };
    }

    const userId = sessionData.userId;
    return await fetchUserActivities(userId);
  } catch (error) {
    console.error('[fetchUserActivitiesAction] Fehler:', error);
    return {
      activities: [],
      userStatus: {
        isRegistered: false,
        name: undefined,
        groupId: undefined,
        groupName: undefined,
        groupColor: undefined,
      } as UserStatus
    };
  }
}

/**
 * Lädt alle Aufgaben für einen Benutzer basierend auf seiner Gruppenzugehörigkeit
 * INTERNE FUNKTION - wird nur von fetchUserActivitiesAction aufgerufen
 */
async function fetchUserActivities(userId: string): Promise<UserActivitiesData> {
  try {
    await connectDB();
    await initActivityDefaults();

    const user = await User.findById(userId).populate('groupId', 'name color').lean();
    
    if (!user) {
      return {
        activities: [],
        userStatus: {
          isRegistered: false,
          name: undefined,
          groupId: undefined,
          groupName: undefined,
          groupColor: undefined,
        } as UserStatus
      };
    }

    // User status
    const userStatus: UserStatus = {
      isRegistered: true,
      name: user.name,
      groupId: user.groupId ? (typeof user.groupId === 'string' ? user.groupId : (user.groupId as any)._id?.toString()) : undefined,
      groupName: (user.groupId as any)?.name,
      groupColor: (user.groupId as any)?.color,
    };

    // Get activities for the user's group
    let activities: ActivityWithCategoryAndTemplate[] = [];
    
    if (user.groupId) {
      const groupActivities = await Activity.find({ 
        groupId: user.groupId 
      })
      .populate('categoryId', 'name icon color')
      .populate('templateId', 'name defaultDescription')
      .populate('groupId', 'name color')
      .populate('responsibleUsers', 'name email _id') 
      .sort({ date: 1, startTime: 1 })
      .lean();

      activities = groupActivities.map(activity => ({
        _id: String(activity._id),
        date: activity.date.toISOString().split('T')[0],
        startTime: activity.startTime,
        endTime: activity.endTime,
        categoryId: String((activity.categoryId as any)._id),
        templateId: activity.templateId ? String((activity.templateId as any)._id) : undefined,
        customName: activity.customName,
        description: activity.description,
        groupId: activity.groupId ? String((activity.groupId as any)._id) : undefined,
        responsibleUsers: (activity.responsibleUsers as any[])?.map(user => String(user._id)) || [],
        createdBy: activity.createdBy || '',
        agendaJobId: activity.agendaJobId,
        responsiblePushJobId: activity.responsiblePushJobId,
        createdAt: activity.createdAt?.toISOString() || '',
        updatedAt: activity.updatedAt?.toISOString() || '',
        
        category: activity.categoryId ? {
          _id: String((activity.categoryId as any)._id),
          name: (activity.categoryId as any).name,
          icon: (activity.categoryId as any).icon,
          color: (activity.categoryId as any).color,
          isDefault: (activity.categoryId as any).isDefault || false,
          createdAt: (activity.categoryId as any).createdAt?.toISOString() || '',
          updatedAt: (activity.categoryId as any).updatedAt?.toISOString() || '',
        } : {
          _id: '',
          name: 'Unbekannt',
          icon: 'HelpCircle',
          color: '#666666',
          isDefault: false,
          createdAt: '',
          updatedAt: '',
        },
        
        template: activity.templateId ? {
          _id: String((activity.templateId as any)._id),
          name: (activity.templateId as any).name,
          categoryId: String((activity.templateId as any).categoryId) || '',
          defaultDescription: (activity.templateId as any).defaultDescription,
          createdAt: (activity.templateId as any).createdAt?.toISOString() || '',
          updatedAt: (activity.templateId as any).updatedAt?.toISOString() || '',
        } : undefined,
        
        group: activity.groupId ? {
          _id: String((activity.groupId as any)._id),
          name: (activity.groupId as any).name,
          color: (activity.groupId as any).color
        } : undefined,
        
        responsibleUsersData: (activity.responsibleUsers as any[])?.map(user => ({
          _id: String(user._id),
          name: user.name,
          email: user.email
        })) || []
      })) as ActivityWithCategoryAndTemplate[];
    }

    return {
      activities,
      userStatus
    };

  } catch (error) {
    console.error('[fetchUserActivities] Fehler beim Laden der Benutzer-Aufgaben:', error);
    return {
      activities: [],
      userStatus: {
        isRegistered: false,
        name: undefined,
        groupId: undefined,
        groupName: undefined,
        groupColor: undefined,
      } as UserStatus
    };
  }
} 