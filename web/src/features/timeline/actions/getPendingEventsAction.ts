"use server";

import { getPendingEvents } from '@/features/timeline/services/eventService';
import type { Event } from '../types/types';

/**
 * Action: Liefert alle Event-Vorschläge mit Status 'pending' (zur Moderation).
 */
export async function getPendingEventsAction(): Promise<Event[]> {
  try {
    const events = await getPendingEvents();
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error('[getPendingEventsAction]', error);
    return [];
  }
} 