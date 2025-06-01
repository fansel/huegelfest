'use server';

import { deleteActivity } from '../services/activityService';
import { connectDB } from '@/lib/db/connector';

export async function deleteActivityAction(id: string) {
  try {
    await connectDB();

    const result = await deleteActivity(id);
    return result;
  } catch (error: any) {
    console.error('[deleteActivityAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Löschen der Aktivität.',
    };
  }
} 