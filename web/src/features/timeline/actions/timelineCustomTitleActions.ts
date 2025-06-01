"use server";

import { setTimelineCustomTitle, deleteTimelineCustomTitle, type TimelineCustomTitleData } from '../services/timelineCustomTitleService';

/**
 * Setzt oder aktualisiert einen Timeline Custom Title
 */
export async function setTimelineCustomTitleAction(data: TimelineCustomTitleData) {
  try {
    const result = await setTimelineCustomTitle(data);
    return result;
  } catch (error: any) {
    console.error('[setTimelineCustomTitleAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Speichern des Custom Titels',
    };
  }
}

/**
 * Löscht einen Timeline Custom Title
 */
export async function deleteTimelineCustomTitleAction(festivalDayId: string) {
  try {
    const result = await deleteTimelineCustomTitle(festivalDayId);
    return result;
  } catch (error: any) {
    console.error('[deleteTimelineCustomTitleAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Löschen des Custom Titels',
    };
  }
} 