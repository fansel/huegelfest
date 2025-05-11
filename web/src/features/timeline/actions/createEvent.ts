"use server";

import type { Event, TimelineData } from '../types/types';
import { addEventToDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Füge einem Tag ein Event hinzu
 * @param dayId - Die ID des Tags
 * @param event - Das neue Event
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function createEvent(dayId: string, event: Event): Promise<TimelineData | TimelineServiceError> {
  console.log('[createEvent Action] Aufgerufen mit:', { dayId, event });
  return await addEventToDay(dayId, event);
} 