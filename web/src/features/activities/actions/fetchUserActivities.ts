'use server';

import { Activity } from '@/lib/db/models/Activity';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';
import { getUserWithRegistration } from '@/features/auth/services/userService';
import type { ActivityWithCategoryAndTemplate } from '../types';

export interface UserActivitiesData {
  activities: ActivityWithCategoryAndTemplate[];
  userStatus: {
    isRegistered: boolean;
    name?: string;
    groupId?: string;
    groupName?: string;
    groupColor?: string;
  };
}

/**
 * Lädt alle Aufgaben für einen Benutzer basierend auf seiner Gruppenzugehörigkeit
 */
export async function fetchUserActivitiesAction(deviceId: string): Promise<UserActivitiesData> {
  try {
    await connectDB();
    await initActivityDefaults();

    // Get user status first
    const user = await getUserWithRegistration(deviceId);
    
    if (!user || !user.groupId) {
      return {
        activities: [],
        userStatus: { 
          isRegistered: !!user,
          name: user?.name,
          groupId: undefined,
          groupName: undefined,
          groupColor: undefined
        }
      };
    }

    // Get activities for user's group
    const activities = await Activity.find({ groupId: user.groupId._id })
      .populate('categoryId', 'name icon color')
      .populate('templateId', 'name defaultDescription')
      .populate('groupId', 'name color')
      .populate('responsibleUsers', 'name deviceId')
      .sort({ date: 1, time: 1 })
      .lean();

    // Convert to proper format with populated data
    const populatedActivities: ActivityWithCategoryAndTemplate[] = activities.map(activity => {
      const category = activity.categoryId as any;
      const template = activity.templateId as any;
      const group = activity.groupId as any;
      const responsibleUsers = activity.responsibleUsers as any[];

      return {
        _id: activity._id.toString(),
        date: activity.date.toISOString(),
        time: activity.time,
        categoryId: category._id.toString(),
        templateId: template?._id.toString(),
        customName: activity.customName,
        description: activity.description,
        groupId: group._id.toString(),
        responsibleUsers: responsibleUsers ? responsibleUsers.map(user => user._id.toString()) : [],
        createdBy: activity.createdBy,
        agendaJobId: activity.agendaJobId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
        category: {
          _id: category._id.toString(),
          name: category.name,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault || false,
          createdAt: category.createdAt ? category.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: category.updatedAt ? category.updatedAt.toISOString() : new Date().toISOString(),
        },
        template: template ? {
          _id: template._id.toString(),
          name: template.name,
          defaultDescription: template.defaultDescription,
          categoryId: template.categoryId.toString(),
          createdAt: template.createdAt ? template.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: template.updatedAt ? template.updatedAt.toISOString() : new Date().toISOString(),
        } : undefined,
        group: {
          _id: group._id.toString(),
          name: group.name,
          color: group.color
        },
        responsibleUsersData: responsibleUsers ? responsibleUsers.map(user => ({
          _id: user._id.toString(),
          name: user.name,
          deviceId: user.deviceId
        })) : []
      };
    });

    return {
      activities: populatedActivities,
      userStatus: {
        isRegistered: true,
        name: user.name,
        groupId: user.groupId._id.toString(),
        groupName: user.groupId.name,
        groupColor: populatedActivities.length > 0 ? populatedActivities[0].group?.color : undefined
      }
    };
  } catch (error: any) {
    console.error('[fetchUserActivitiesAction]', error);
    return {
      activities: [],
      userStatus: { isRegistered: false }
    };
  }
} 