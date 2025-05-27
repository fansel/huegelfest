'use server';

import { Activity } from '@/lib/db/models/Activity';
import { getAllActivityCategories } from '../services/activityCategoryService';
import { ActivityTemplate } from '@/lib/db/models/ActivityTemplate';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';
import type { ActivityWithCategoryAndTemplate, ActivityCategory, ActivityTemplate as ActivityTemplateType } from '../types';
import { Group } from '@/lib/db/models/Group';
import { User } from '@/lib/db/models/User';

export interface ActivitiesData {
  activities: ActivityWithCategoryAndTemplate[];
  categories: ActivityCategory[];
  templates: ActivityTemplateType[];
  groups: any[]; // Group interface from groups feature
}

export interface GroupUser {
  _id: string;
  name: string;
  deviceId: string;
}

/**
 * Aggregiert alle Daten für das Activities-Management: Activities, Kategorien, Templates, Gruppen
 */
export async function fetchActivitiesData(): Promise<ActivitiesData> {
  try {
    await connectDB();
    await initActivityDefaults();

    // Load all data in parallel
    const [activitiesResult, categoriesResult, templatesResult, groupsResult] = await Promise.all([
      loadActivitiesWithPopulatedData(),
      loadCategories(),
      loadTemplates(),
      loadGroups()
    ]);

    return {
      activities: activitiesResult || [],
      categories: categoriesResult || [],
      templates: templatesResult || [],
      groups: groupsResult || []
    };
  } catch (error) {
    console.error('[fetchActivitiesData] Fehler beim Laden der Activity-Daten:', error);
    return {
      activities: [],
      categories: [],
      templates: [],
      groups: []
    };
  }
}

async function loadCategories(): Promise<ActivityCategory[]> {
  try {
    const categories = await getAllActivityCategories();
    return categories.map(cat => ({
      ...cat,
      createdAt: cat.createdAt.toString(),
      updatedAt: cat.updatedAt.toString(),
    })) as ActivityCategory[];
  } catch (error) {
    console.error('Fehler beim Laden der Categories:', error);
    return [];
  }
}

async function loadActivitiesWithPopulatedData(): Promise<any[]> {
  try {
    const activities = await Activity.find()
      .populate('categoryId', 'name icon color')
      .populate('templateId', 'name defaultDescription')
      .populate('groupId', 'name color')
      .populate('responsibleUsers', 'name deviceId')
      .sort({ date: 1, startTime: 1 })
      .lean();

    return activities.map(activity => {
      // Safely extract populated data
      const category = activity.categoryId as any;
      const template = activity.templateId as any;
      const group = activity.groupId as any;
      const responsibleUsers = activity.responsibleUsers as any[];

      return {
        _id: (activity._id as any).toString(),
        date: activity.date.toISOString(),
        startTime: activity.startTime,
        endTime: activity.endTime,
        categoryId: category?._id?.toString() || (activity.categoryId as any).toString(),
        templateId: template?._id?.toString() || (activity.templateId ? (activity.templateId as any).toString() : undefined),
        customName: activity.customName,
        description: activity.description,
        groupId: group?._id?.toString() || (activity.groupId ? (activity.groupId as any).toString() : undefined),
        responsibleUsers: responsibleUsers?.map(user => user?._id?.toString()) || [],
        createdBy: activity.createdBy,
        agendaJobId: activity.agendaJobId,
        responsiblePushJobId: activity.responsiblePushJobId,
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
        
        // Populated data with safe serialization
        category: category ? {
          _id: category._id.toString(),
          name: category.name,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault || false,
          createdAt: category.createdAt?.toISOString() || '',
          updatedAt: category.updatedAt?.toISOString() || '',
        } : undefined,
        
        template: template ? {
          _id: template._id.toString(),
          name: template.name,
          categoryId: template.categoryId.toString(),
          defaultDescription: template.defaultDescription,
          createdAt: template.createdAt?.toISOString() || '',
          updatedAt: template.updatedAt?.toISOString() || '',
        } : undefined,
        
        group: group ? {
          _id: group._id.toString(),
          name: group.name,
          color: group.color
        } : undefined,
        
        responsibleUsersData: responsibleUsers?.map(user => ({
          _id: user?._id?.toString(),
          name: user?.name,
          deviceId: user?.deviceId
        })) || []
      };
    });
  } catch (error) {
    console.error('Fehler beim Laden der Activities:', error);
    return [];
  }
}

async function loadTemplates(): Promise<ActivityTemplateType[]> {
  try {
    const templates = await ActivityTemplate.find()
      .populate('categoryId', 'name icon color')
      .sort({ categoryId: 1, name: 1 })
      .lean();

    return templates.map(template => ({
      ...template,
      _id: template._id.toString(),
      categoryId: template.categoryId.toString(),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    })) as ActivityTemplateType[];
  } catch (error) {
    console.error('Fehler beim Laden der Templates:', error);
    return [];
  }
}

async function loadGroups(): Promise<any[]> {
  try {
    const { getAllGroups } = await import('@/features/groups/services/groupService');
    const groupsResult = await getAllGroups();
    return groupsResult.success && groupsResult.data ? groupsResult.data : [];
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return [];
  }
}

/**
 * Lädt User einer bestimmten Gruppe für die Hauptverantwortlichkeit
 */
export async function fetchGroupUsersAction(groupId: string): Promise<GroupUser[]> {
  try {
    await connectDB();
    
    const users = await User.find({ 
      groupId: groupId,
      isActive: true
    })
    .select('_id name deviceId')
    .sort({ name: 1 })
    .lean();

    return users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      deviceId: user.deviceId
    }));
  } catch (error) {
    console.error('Fehler beim Laden der Gruppe-User:', error);
    return [];
  }
} 