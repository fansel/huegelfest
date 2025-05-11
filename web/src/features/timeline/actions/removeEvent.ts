"use server";
import type { TimelineData } from '../types/types';
import { deleteEventFromDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Lösche ein Event aus einem Tag
 * @param dayId - Die ID des Tags
 * @param eventId - Die ID des zu löschenden Events
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function removeEvent(dayId: string, eventId: string): Promise<TimelineData | TimelineServiceError> {
  return await deleteEventFromDay(dayId, eventId);
} 