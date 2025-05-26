'use server';

import { sendActivityReminder } from '../services/activityService';
import { connectDB } from '@/lib/db/connector';

export async function sendReminderAction(activityId: string) {
  try {
    await connectDB();

    const result = await sendActivityReminder(activityId);
    return result;
  } catch (error: any) {
    console.error('[sendReminderAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Senden der Erinnerung.',
      sent: 0,
    };
  }
} 