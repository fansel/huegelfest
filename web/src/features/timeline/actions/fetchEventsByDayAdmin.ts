"use server";

import { getEventsByDay } from '@/features/timeline/services/eventService';

/**
 * Liefert alle Events eines Tages (Admin-Frontend, optional Status-Filter).
 * Rückgabetyp ist any[], da .lean() kein echtes IEvent liefert.
 */
export async function fetchEventsByDayAdmin(dayId: string, status?: 'pending' | 'approved' | 'rejected'): Promise<any[]> {
  try {
    return await getEventsByDay(dayId, status);
  } catch (error) {
    console.error('Fehler beim Laden der Events:', error);
    throw new Error('Events konnten nicht geladen werden.');
  }
} 