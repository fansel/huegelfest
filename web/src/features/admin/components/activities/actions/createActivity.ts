'use server';

import { createActivity } from '../services/activityService';
import { connectDB } from '@/lib/db/connector';
import { initActivityDefaults } from '@/lib/db/initActivityDefaults';
import type { CreateActivityData } from '../types';

export async function createActivityAction(data: CreateActivityData, createdBy: string) {
  try {
    await connectDB();
    await initActivityDefaults(); // Ensure defaults exist

    if (!data.categoryId) {
      throw new Error('Kategorie ist erforderlich');
    }

    if (!data.description?.trim()) {
      throw new Error('Beschreibung ist erforderlich');
    }

    const result = await createActivity(data, createdBy);
    return {
      success: true,
      activity: result,
    };
  } catch (error: any) {
    console.error('[createActivityAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Erstellen der Aktivität.',
    };
  }
} 