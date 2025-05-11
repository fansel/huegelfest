"use server";

import type { TimelineData } from '../types/types';
import { getTimeline, TimelineServiceError } from '../services/timelineService';

/**
 * Action: Hole die aktuelle Timeline
 * @returns Die aktuelle Timeline oder ein Fehlerobjekt
 */
export async function fetchTimeline(): Promise<TimelineData | TimelineServiceError> {
  const result = await getTimeline();
  console.log('[fetchTimeline] Ergebnis:', JSON.stringify(result, null, 2));
  return result ?? { error: 'Timeline konnte nicht geladen werden.' };
} 