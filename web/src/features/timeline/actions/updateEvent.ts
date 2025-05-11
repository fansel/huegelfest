"use server";

import type { Event, TimelineData } from '../types/types';
import { editEventInDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Bearbeite ein Event in einem Tag
 * @param dayId - Die ID des Tags
 * @param event - Das bearbeitete Event
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function updateEvent(dayId: string, event: Event): Promise<TimelineData | TimelineServiceError> {
  return await editEventInDay(dayId, event);
} 