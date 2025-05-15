"use server";
import { deleteDay } from '@/features/timeline/services/dayService';

/**
 * Action: Lösche einen Tag
 * @param dayId - Die ID des zu löschenden Tags
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function removeDayAction(dayId: string) {
  try {
    const result = await deleteDay(dayId);
    return { success: true, deleted: !!result };
  } catch (error: any) {
    console.error('[removeDayAction]', error);
    return { success: false, error: error.message || 'Fehler beim Löschen des Tages.' };
  }
} 