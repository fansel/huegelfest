'use server';

import { Activity } from '@/lib/db/models/Activity';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';
import { getUserWithRegistration } from '@/features/auth/services/userService';
import type { ActivityWithCategoryAndTemplate, UserStatus } from '../types';
import { ActivityCategory } from '@/lib/db/models/ActivityCategory';
import { ActivityTemplate } from '@/lib/db/models/ActivityTemplate';
import { Group } from '@/lib/db/models/Group';
import { User } from '@/lib/db/models/User';

export interface UserActivitiesData {
  activities: ActivityWithCategoryAndTemplate[];
  userStatus: UserStatus;
}

/**
 * Lädt alle Aufgaben für einen Benutzer basierend auf seiner Gruppenzugehörigkeit
 */
export async function fetchUserActivities(deviceId: string | null): Promise<UserActivitiesData> {
  if (!deviceId) {
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

  try {
    await connectDB();
    await initActivityDefaults();

    // Get user information
    const user = await User.findOne({ deviceId }).populate('groupId', 'name color').lean();
    
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

    const userStatus: UserStatus = {
      isRegistered: true,
      name: user.name,
      groupId: user.groupId?._id?.toString() || user.groupId?.toString(),
      groupName: (user.groupId as any)?.name,
      groupColor: (user.groupId as any)?.color,
    };

    // If user has no group, return empty activities
    if (!userStatus.groupId) {
      return {
        activities: [],
        userStatus
      };
    }

    // Get activities for user's group
    const activities = await Activity.find({ 
      groupId: userStatus.groupId 
    })
      .populate('categoryId', 'name icon color')
      .populate('templateId', 'name defaultDescription')
      .populate('groupId', 'name color')
      .populate('responsibleUsers', 'name deviceId')
      .sort({ date: 1, startTime: 1 })
      .lean();

    const populatedActivities: ActivityWithCategoryAndTemplate[] = activities.map(activity => {
      // Get responsible users data
      const responsibleUsersData = (activity.responsibleUsers as any[])?.map(user => ({
        _id: user._id.toString(),
        name: user.name,
        deviceId: user.deviceId
      })) || [];

      return {
        _id: (activity._id as any).toString(),
        date: activity.date.toISOString(),
        startTime: activity.startTime,
        endTime: activity.endTime,
        categoryId: (activity.categoryId as any)._id.toString(),
        templateId: (activity.templateId as any)?._id?.toString(),
        customName: activity.customName,
        description: activity.description,
        groupId: (activity.groupId as any)._id.toString(),
        responsibleUsers: (activity.responsibleUsers as any[])?.map(user => user._id.toString()) || [],
        createdBy: activity.createdBy,
        agendaJobId: activity.agendaJobId,
        responsiblePushJobId: activity.responsiblePushJobId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
        category: {
          _id: (activity.categoryId as any)._id.toString(),
          name: (activity.categoryId as any).name,
          icon: (activity.categoryId as any).icon,
          color: (activity.categoryId as any).color,
          isDefault: (activity.categoryId as any).isDefault || false,
          createdAt: (activity.categoryId as any).createdAt?.toISOString() || '',
          updatedAt: (activity.categoryId as any).updatedAt?.toISOString() || '',
        },
        template: activity.templateId ? {
          _id: (activity.templateId as any)._id.toString(),
          name: (activity.templateId as any).name,
          categoryId: (activity.templateId as any).categoryId.toString(),
          defaultDescription: (activity.templateId as any).defaultDescription,
          createdAt: (activity.templateId as any).createdAt?.toISOString() || '',
          updatedAt: (activity.templateId as any).updatedAt?.toISOString() || '',
        } : undefined,
        group: {
          _id: (activity.groupId as any)._id.toString(),
          name: (activity.groupId as any).name,
          color: (activity.groupId as any).color,
        },
        responsibleUsersData
      };
    });

    return {
      activities: populatedActivities,
      userStatus
    };

  } catch (error) {
    console.error('Error fetching user activities:', error);
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
 * Server Action wrapper for fetchUserActivities
 */
export async function fetchUserActivitiesAction(deviceId: string): Promise<UserActivitiesData> {
  return fetchUserActivities(deviceId);
} 