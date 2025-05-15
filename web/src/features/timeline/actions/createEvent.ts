"use server";

import { submitEvent } from '@/features/timeline/actions/submitEvent';
import { EventSubmission } from '@/features/timeline/actions/submitEvent';

/**
 * Action: Füge einem Tag ein Event hinzu
 * @param event - Das neue Event
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function createEvent(event: Record<string, any>) {
  return submitEvent(event);
} 