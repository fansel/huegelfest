"use server";

import { getEventsByDay } from '@/features/timeline/services/eventService';

/**
 * Liefert nur freigegebene Events eines Tages (User-Frontend).
 * Rückgabetyp ist any[], da .lean() kein echtes IEvent liefert.
 */
export async function fetchApprovedEventsByDay(dayId: string): Promise<any[]> {
  try {
    return await getEventsByDay(dayId, 'approved');
  } catch (error) {
    console.error('Fehler beim Laden der Events:', error);
    throw new Error('Events konnten nicht geladen werden.');
  }
} 