"use server";
import type { TimelineData } from '../types/types';
import { deleteDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Lösche einen Tag
 * @param dayId - Die ID des zu löschenden Tags
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function removeDay(dayId: string): Promise<TimelineData | TimelineServiceError> {
  console.log('[removeDay Action] Aufgerufen mit dayId:', dayId);
  return await deleteDay(dayId);
} 