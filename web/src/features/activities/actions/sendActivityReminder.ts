'use server';

import { sendActivityReminder } from '../services/activityService';
import { connectDB } from '@/lib/db/connector';

export async function sendActivityReminderAction(activityId: string) {
  try {
    await connectDB();

    if (!activityId?.trim()) {
      throw new Error('Aktivitäts-ID ist erforderlich');
    }

    const result = await sendActivityReminder(activityId);
    return {
      success: true,
      sent: result.sent,
      message: `Erinnerung an ${result.sent} Benutzer gesendet`,
    };
  } catch (error: any) {
    console.error('[sendActivityReminderAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Senden der Erinnerung.',
    };
  }
} 