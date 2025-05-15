'use server';

import { createDay } from '@/features/timeline/services/dayService';
import type { IDay } from '@/lib/db/models/Day';

/**
 * Action: Füge einen Tag hinzu
 * @param day - Der neue Tag
 * @returns Die aktualisierte Timeline oder ein Fehlerobjekt
 */
export async function createDayAction(data: { title: string; description?: string; date: Date }) {
  try {
    if (!data.title || !data.date) {
      throw new Error('Titel und Datum sind erforderlich.');
    }
    // Datum ggf. in Date-Objekt umwandeln
    const dateObj = typeof data.date === 'string' ? new Date(data.date) : data.date;
    if (isNaN(dateObj.getTime())) {
      throw new Error('Ungültiges Datumsformat.');
    }
    const result = await createDay({ ...data, date: dateObj });
    // Wandle das Ergebnis in ein Plain-Object um:
    const plainDay = result.toObject ? result.toObject() : JSON.parse(JSON.stringify(result));
    return {
      success: true,
      day: plainDay,
    };
  } catch (error: any) {
    console.error('[createDayAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Anlegen des Tages.',
    };
  }
} 