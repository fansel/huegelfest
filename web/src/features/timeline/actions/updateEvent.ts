"use server";

import { updateEvent as updateEventService } from '@/features/timeline/services/eventService';
import type { IEvent } from '@/lib/db/models/Event';

/**
 * Action: Bearbeite ein Event in einem Tag
 * @param eventId - Die ID des Events
 * @param data - Die aktualisierten Daten des Events
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function updateEvent(eventId: string, data: Partial<any>) {
  // Erlaube das Aktualisieren beliebiger Felder
  return await updateEventService(eventId, data);
} 