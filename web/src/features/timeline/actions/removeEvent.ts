"use server";

import { deleteEvent } from '@/features/timeline/services/eventService';

/**
 * Löschen eines Events (Admin).
 */
export async function removeEvent(eventId: string): Promise<void> {
  try {
    await deleteEvent(eventId);
  } catch (error) {
    console.error('Fehler beim Löschen des Events:', error);
    throw new Error('Event konnte nicht gelöscht werden.');
  }
} 