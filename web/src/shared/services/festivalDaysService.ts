"use server";

import { connectDB } from '@/lib/db/connector';
import { FestivalDay } from '@/lib/db/models/FestivalDay';
import { broadcast } from '@/lib/websocket/broadcast';

export interface CentralFestivalDay {
  _id?: string;
  date: Date;
  label: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFestivalDayData {
  date: Date;
  label: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFestivalDayData {
  date?: Date;
  label?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

/**
 * Zentrale Festival-Tage-Verwaltung für alle Komponenten
 */

/**
 * Gibt alle aktiven Festival-Tage zurück (für die normale App-Nutzung)
 */
export async function getCentralFestivalDays(): Promise<CentralFestivalDay[]> {
  try {
    await connectDB();
    
    const festivalDays = await FestivalDay.find({ isActive: { $ne: false } })
      .sort({ order: 1 })
      .lean();

    const result: CentralFestivalDay[] = festivalDays.map(day => ({
      _id: (day._id as any).toString(),
      date: day.date,
      label: day.label,
      description: day.description,
      isActive: day.isActive,
      order: day.order,
      createdAt: day.createdAt?.toISOString(),
      updatedAt: day.updatedAt?.toISOString(),
    }));

    return result;
  } catch (error) {
    console.error('[getCentralFestivalDays] Fehler:', error);
    throw error;
  }
}

/**
 * Gibt einen einzelnen Festival-Tag anhand seiner ID zurück
 */
export async function getCentralFestivalDayById(id: string): Promise<CentralFestivalDay | null> {
  try {
    await connectDB();
    
    const festivalDay = await FestivalDay.findById(id).lean();
    if (!festivalDay) {
      return null;
    }

    const result: CentralFestivalDay = {
      _id: (festivalDay._id as any).toString(),
      date: festivalDay.date,
      label: festivalDay.label,
      description: festivalDay.description,
      isActive: festivalDay.isActive,
      order: festivalDay.order,
      createdAt: festivalDay.createdAt?.toISOString(),
      updatedAt: festivalDay.updatedAt?.toISOString(),
    };

    return result;
  } catch (error) {
    console.error('[getCentralFestivalDayById] Fehler:', error);
    return null;
  }
}

/**
 * Holt alle Festival-Tage (auch inaktive) für Admin-Interface
 */
export async function getAllCentralFestivalDays(): Promise<CentralFestivalDay[]> {
  try {
    await connectDB();
    await initDefaultFestivalDaysIfEmpty();
    
    const days = await FestivalDay.find()
      .sort({ order: 1 })
      .lean();

    return (days as any[]).map(day => ({
      _id: day._id.toString(),
      date: day.date,
      label: day.label,
      description: day.description,
      isActive: day.isActive,
      order: day.order,
      createdAt: day.createdAt?.toISOString(),
      updatedAt: day.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error('[getAllCentralFestivalDays] Fehler:', error);
    return [];
  }
}

/**
 * Erstellt einen neuen Festival-Tag
 */
export async function createCentralFestivalDay(data: CreateFestivalDayData): Promise<{ success: boolean; day?: CentralFestivalDay; error?: string }> {
  try {
    await connectDB();
    
    // Prüfe auf doppelte Daten
    const existingDay = await FestivalDay.findOne({ date: data.date });
    if (existingDay) {
      return { success: false, error: 'Ein Tag mit diesem Datum existiert bereits' };
    }
    
    // Bestimme die nächste Reihenfolge-Nummer
    const maxOrder = await FestivalDay.findOne({}, {}, { sort: { order: -1 } });
    const nextOrder = data.order ?? (maxOrder ? maxOrder.order + 1 : 1);

    const festivalDay = new FestivalDay({
      date: data.date,
      label: data.label,
      description: data.description,
      isActive: data.isActive ?? true,
      order: nextOrder,
    });

    await festivalDay.save();

    const result: CentralFestivalDay = {
      _id: (festivalDay._id as any).toString(),
      date: festivalDay.date,
      label: festivalDay.label,
      description: festivalDay.description,
      isActive: festivalDay.isActive,
      order: festivalDay.order,
      createdAt: festivalDay.createdAt.toISOString(),
      updatedAt: festivalDay.updatedAt.toISOString(),
    };

    // Broadcast über WebSocket
    try {
      await broadcast('festival-day', {
        type: 'FESTIVAL_DAY_CREATED',
        data: result
      });
    } catch (error) {
      console.error('[Festival Day] Fehler beim Broadcast:', error);
    }

    return { success: true, day: result };
  } catch (error: any) {
    console.error('[createCentralFestivalDay] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Erstellen des Festival-Tags' };
  }
}

/**
 * Aktualisiert einen Festival-Tag
 */
export async function updateCentralFestivalDay(id: string, data: UpdateFestivalDayData): Promise<{ success: boolean; day?: CentralFestivalDay; error?: string }> {
  try {
    await connectDB();
    
    const festivalDay = await FestivalDay.findById(id);
    if (!festivalDay) {
      return { success: false, error: 'Festival-Tag nicht gefunden' };
    }

    // Update fields
    if (data.date !== undefined) {
      // Prüfe auf doppelte Daten (außer dem aktuellen Tag)
      const existingDay = await FestivalDay.findOne({ 
        date: data.date, 
        _id: { $ne: id } 
      });
      if (existingDay) {
        return { success: false, error: 'Ein Tag mit diesem Datum existiert bereits' };
      }
      festivalDay.date = data.date;
    }
    if (data.label !== undefined) festivalDay.label = data.label;
    if (data.description !== undefined) festivalDay.description = data.description;
    if (data.isActive !== undefined) festivalDay.isActive = data.isActive;
    if (data.order !== undefined) festivalDay.order = data.order;

    await festivalDay.save();

    const result: CentralFestivalDay = {
      _id: (festivalDay._id as any).toString(),
      date: festivalDay.date,
      label: festivalDay.label,
      description: festivalDay.description,
      isActive: festivalDay.isActive,
      order: festivalDay.order,
      createdAt: festivalDay.createdAt.toISOString(),
      updatedAt: festivalDay.updatedAt.toISOString(),
    };

    // Broadcast über WebSocket
    try {
      await broadcast('festival-day', {
        type: 'FESTIVAL_DAY_UPDATED',
        data: result
      });
    } catch (error) {
      console.error('[Festival Day] Fehler beim Broadcast:', error);
    }

    return { success: true, day: result };
  } catch (error: any) {
    console.error('[updateCentralFestivalDay] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Aktualisieren des Festival-Tags' };
  }
}

/**
 * Löscht einen Festival-Tag
 */
export async function deleteCentralFestivalDay(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await connectDB();
    
    const festivalDay = await FestivalDay.findById(id);
    if (!festivalDay) {
      return { success: false, error: 'Festival-Tag nicht gefunden' };
    }

    await festivalDay.deleteOne();

    // Broadcast über WebSocket
    try {
      await broadcast('festival-day', {
        type: 'FESTIVAL_DAY_DELETED',
        data: { festivalDayId: id }
      });
    } catch (error) {
      console.error('[Festival Day] Fehler beim Broadcast:', error);
    }

    return { success: true, message: 'Festival-Tag gelöscht' };
  } catch (error: any) {
    console.error('[deleteCentralFestivalDay] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Löschen des Festival-Tags' };
  }
}

/**
 * Ändert die Reihenfolge der Festival-Tage
 */
export async function reorderCentralFestivalDays(dayIds: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await connectDB();
    
    const updates = dayIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index + 1 },
      },
    }));

    await FestivalDay.bulkWrite(updates);

    // Broadcast über WebSocket
    try {
      await broadcast('festival-day', {
        type: 'FESTIVAL_DAY_REORDERED',
        data: { dayIds }
      });
    } catch (error) {
      console.error('[Festival Day] Fehler beim Broadcast:', error);
    }

    return { success: true, message: 'Reihenfolge der Festival-Tage aktualisiert' };
  } catch (error: any) {
    console.error('[reorderCentralFestivalDays] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Ändern der Reihenfolge' };
  }
}

/**
 * Initialisiert Standard-Festival-Tage falls keine vorhanden
 */
export async function initDefaultFestivalDaysIfEmpty(): Promise<void> {
  try {
    const existingDays = await FestivalDay.countDocuments();
    
    if (existingDays === 0) {
      // Erstelle Standard-Tage für Hügelfest
      const currentYear = new Date().getFullYear();
      const defaultDays = [
        {
          date: new Date(`${currentYear}-07-31`),
          label: '31.07. - Anreise',
          description: 'Anreise und erste Aufbauarbeiten',
          isActive: true,
          order: 1,
        },
        {
          date: new Date(`${currentYear}-08-01`),
          label: '01.08. - Festival Tag 1',
          description: 'Erster Festivaltag',
          isActive: true,
          order: 2,
        },
        {
          date: new Date(`${currentYear}-08-02`),
          label: '02.08. - Festival Tag 2',
          description: 'Zweiter Festivaltag',
          isActive: true,
          order: 3,
        },
        {
          date: new Date(`${currentYear}-08-03`),
          label: '03.08. - Abreise',
          description: 'Abbau und Abreise',
          isActive: true,
          order: 4,
        },
      ];

      await Promise.all(defaultDays.map(day => createCentralFestivalDay(day)));
    }
  } catch (error) {
    console.error('[initDefaultFestivalDaysIfEmpty] Fehler:', error);
  }
} 