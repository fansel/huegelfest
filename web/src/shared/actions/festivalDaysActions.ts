"use server";

import { 
  getCentralFestivalDays, 
  getAllCentralFestivalDays,
  createCentralFestivalDay, 
  updateCentralFestivalDay, 
  deleteCentralFestivalDay, 
  reorderCentralFestivalDays 
} from '../services/festivalDaysService';
import type { CreateFestivalDayData, UpdateFestivalDayData } from '../services/festivalDaysService';

/**
 * Holt alle aktiven Festival-Tage
 */
export async function getCentralFestivalDaysAction() {
  try {
    const days = await getCentralFestivalDays();
    return {
      success: true,
      days,
    };
  } catch (error: any) {
    console.error('[getCentralFestivalDaysAction] Fehler:', error);
    return {
      success: false,
      days: [],
      error: error.message || 'Unbekannter Fehler beim Laden der Festival-Tage',
    };
  }
}

/**
 * Holt alle Festival-Tage (auch inaktive) für Admin-Interface
 */
export async function getAllCentralFestivalDaysAction() {
  try {
    const days = await getAllCentralFestivalDays();
    return {
      success: true,
      days,
    };
  } catch (error: any) {
    console.error('[getAllCentralFestivalDaysAction] Fehler:', error);
    return {
      success: false,
      days: [],
      error: error.message || 'Unbekannter Fehler beim Laden aller Festival-Tage',
    };
  }
}

/**
 * Erstellt einen neuen Festival-Tag
 */
export async function createCentralFestivalDayAction(data: CreateFestivalDayData) {
  try {
    const result = await createCentralFestivalDay(data);
    return result;
  } catch (error: any) {
    console.error('[createCentralFestivalDayAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Erstellen des Festival-Tags',
    };
  }
}

/**
 * Aktualisiert einen Festival-Tag
 */
export async function updateCentralFestivalDayAction(id: string, data: UpdateFestivalDayData) {
  try {
    const result = await updateCentralFestivalDay(id, data);
    return result;
  } catch (error: any) {
    console.error('[updateCentralFestivalDayAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Aktualisieren des Festival-Tags',
    };
  }
}

/**
 * Löscht einen Festival-Tag
 */
export async function deleteCentralFestivalDayAction(id: string) {
  try {
    const result = await deleteCentralFestivalDay(id);
    return result;
  } catch (error: any) {
    console.error('[deleteCentralFestivalDayAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Löschen des Festival-Tags',
    };
  }
}

/**
 * Ändert die Reihenfolge der Festival-Tage
 */
export async function reorderCentralFestivalDaysAction(dayIds: string[]) {
  try {
    const result = await reorderCentralFestivalDays(dayIds);
    return result;
  } catch (error: any) {
    console.error('[reorderCentralFestivalDaysAction] Fehler:', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Ändern der Reihenfolge',
    };
  }
} 