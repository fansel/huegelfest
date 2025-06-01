'use server';

import { 
  getAllFestivalDays, 
  createFestivalDay, 
  updateFestivalDay, 
  deleteFestivalDay, 
  reorderFestivalDays,
  initDefaultFestivalDays 
} from '../services/festivalDayService';
import { connectDB } from '@/lib/db/connector';
import type { CreateFestivalDayData, UpdateFestivalDayData } from '../types';

export async function getAllFestivalDaysAction() {
  try {
    await connectDB();
    await initDefaultFestivalDays(); // Ensure defaults exist
    
    const days = await getAllFestivalDays();
    return {
      success: true,
      days,
    };
  } catch (error: any) {
    console.error('[getAllFestivalDaysAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Laden der Festival-Tage.',
    };
  }
}

export async function createFestivalDayAction(data: CreateFestivalDayData) {
  try {
    await connectDB();

    if (!data.label?.trim()) {
      throw new Error('Label ist erforderlich');
    }

    if (!data.date) {
      throw new Error('Datum ist erforderlich');
    }

    const day = await createFestivalDay(data);
    return {
      success: true,
      day,
    };
  } catch (error: any) {
    console.error('[createFestivalDayAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Erstellen des Festival-Tags.',
    };
  }
}

export async function updateFestivalDayAction(id: string, data: UpdateFestivalDayData) {
  try {
    await connectDB();

    if (data.label !== undefined && !data.label.trim()) {
      throw new Error('Label darf nicht leer sein');
    }

    const day = await updateFestivalDay(id, data);
    return {
      success: true,
      day,
    };
  } catch (error: any) {
    console.error('[updateFestivalDayAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Aktualisieren des Festival-Tags.',
    };
  }
}

export async function deleteFestivalDayAction(id: string) {
  try {
    await connectDB();

    await deleteFestivalDay(id);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[deleteFestivalDayAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Löschen des Festival-Tags.',
    };
  }
}

export async function reorderFestivalDaysAction(dayIds: string[]) {
  try {
    await connectDB();

    if (!Array.isArray(dayIds) || dayIds.length === 0) {
      throw new Error('Ungültige Reihenfolge-Daten');
    }

    await reorderFestivalDays(dayIds);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[reorderFestivalDaysAction]', error);
    return {
      success: false,
      error: error.message || 'Unbekannter Fehler beim Neuordnen der Festival-Tage.',
    };
  }
} 