"use server";

import type { Day, TimelineData } from '../types/types';
import { updateDay as updateDayService, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Bearbeite einen Tag
 * @param dayId - Die ID des zu bearbeitenden Tages
 * @param day - Die neuen Tagesdaten
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function updateDay(dayId: string, day: Day): Promise<TimelineData | TimelineServiceError> {
  return await updateDayService(dayId, day);
} 