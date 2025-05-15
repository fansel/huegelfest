"use server";

import { updateEvent } from '@/features/timeline/services/eventService';
import { Types } from 'mongoose';

/**
 * Action: Verschiebe ein Event zu einem anderen Tag
 * @param fromDayId - Die ID des Quell-Tags
 * @param toDayId - Die ID des Ziel-Tags
 * @param eventId - Die ID des zu verschiebenden Events
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function moveEvent(eventId: string, toDayId: string) {
  return updateEvent(eventId, { dayId: new Types.ObjectId(toDayId) });
} 