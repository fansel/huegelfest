'use server';

import { getAllActivities, getActivitiesByDate, getActivitiesByGroup } from '../services/activityService';
import { getAllActivityCategories } from '../services/activityCategoryService';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';

export async function fetchActivitiesAction() {
  try {
    await connectDB();
    await initActivityDefaults();

    const activities = await getAllActivities();
    return {
      success: true,
      activities,
    };
  } catch (error: any) {
    console.error('[fetchActivitiesAction]', error);
    return {
      success: false,
      error: error.message || 'Fehler beim Laden der Aktivitäten.',
      activities: [],
    };
  }
}

export async function fetchActivitiesByDateAction(date: string | Date) {
  try {
    await connectDB();

    const activities = await getActivitiesByDate(date);
    return {
      success: true,
      activities,
    };
  } catch (error: any) {
    console.error('[fetchActivitiesByDateAction]', error);
    return {
      success: false,
      error: error.message || 'Fehler beim Laden der Aktivitäten.',
      activities: [],
    };
  }
}

export async function fetchActivitiesByGroupAction(groupId: string) {
  try {
    await connectDB();

    const activities = await getActivitiesByGroup(groupId);
    return {
      success: true,
      activities,
    };
  } catch (error: any) {
    console.error('[fetchActivitiesByGroupAction]', error);
    return {
      success: false,
      error: error.message || 'Fehler beim Laden der Aktivitäten.',
      activities: [],
    };
  }
}

export async function fetchActivityCategoriesAction() {
  try {
    await connectDB();
    await initActivityDefaults();

    const categories = await getAllActivityCategories();
    return {
      success: true,
      categories,
    };
  } catch (error: any) {
    console.error('[fetchActivityCategoriesAction]', error);
    return {
      success: false,
      error: error.message || 'Fehler beim Laden der Kategorien.',
      categories: [],
    };
  }
} 