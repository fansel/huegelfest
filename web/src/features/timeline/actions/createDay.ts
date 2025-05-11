'use server';

import type { Day, TimelineData } from '../types/types';
import { addDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Füge einen Tag hinzu
 * @param day - Der neue Tag
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function createDay(day: Day): Promise<TimelineData | TimelineServiceError> {
  return await addDay(day);
} 