"use server";

import type { TimelineData } from '../types/types';
import { moveEventToAnotherDay, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Verschiebe ein Event zu einem anderen Tag
 * @param fromDayId - Die ID des Quell-Tags
 * @param toDayId - Die ID des Ziel-Tags
 * @param eventId - Die ID des zu verschiebenden Events
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function moveEvent(fromDayId: string, toDayId: string, eventId: string): Promise<TimelineData | TimelineServiceError> {
  return await moveEventToAnotherDay(fromDayId, toDayId, eventId);
} 