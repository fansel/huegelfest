"use server";

import { updateDay } from '@/features/timeline/services/dayService';
import type { IDay } from '@/lib/db/models/Day';

/**
 * Action: Bearbeite einen Tag
 * @param dayId - Die ID des zu bearbeitenden Tages
 * @param data - Die neuen Tagesdaten
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function updateDayAction(dayId: string, data: Partial<any>) {
  try {
    const result = await updateDay(dayId, data);
    let plainDay = null;
    if (Array.isArray(result)) {
      plainDay = result[0] && result[0].toObject ? result[0].toObject() : (result[0] ? JSON.parse(JSON.stringify(result[0])) : null);
    } else if (result && typeof result === 'object') {
      plainDay = result.toObject ? result.toObject() : JSON.parse(JSON.stringify(result));
    }
    return { success: !!plainDay, day: plainDay };
  } catch (error: any) {
    console.error('[updateDayAction]', error);
    return { success: false, error: error.message || 'Fehler beim Aktualisieren des Tages.' };
  }
} 