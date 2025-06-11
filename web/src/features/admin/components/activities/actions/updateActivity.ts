'use server';

import { updateActivity } from '../services/activityService';
import { connectDB } from '@/lib/db/connector';
import type { UpdateActivityData } from '../types';

export async function updateActivityAction(id: string, data: UpdateActivityData) {
  try {
    await connectDB();

    const result = await updateActivity(id, data);
    return {
      success: true,
      activity: result,
    };
  } catch (error: any) {
    console.error('[updateActivityAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Aktualisieren der Aktivität.',
    };
  }
} 