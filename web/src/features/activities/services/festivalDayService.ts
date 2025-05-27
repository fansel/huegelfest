import { FestivalDay } from '@/lib/db/models/FestivalDay';
import { broadcast } from '@/lib/websocket/broadcast';
import type { CreateFestivalDayData, UpdateFestivalDayData, FestivalDay as FestivalDayType } from '../types';

/**
 * Holt alle Festival-Tage sortiert nach Reihenfolge
 */
export async function getAllFestivalDays(): Promise<FestivalDayType[]> {
  const days = await FestivalDay.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  return (days as any[]).map(day => ({
    _id: day._id.toString(),
    date: day.date,
    label: day.label,
    description: day.description,
    isActive: day.isActive,
    order: day.order,
    createdAt: day.createdAt.toISOString(),
    updatedAt: day.updatedAt.toISOString(),
  }));
}

/**
 * Erstellt einen neuen Festival-Tag
 */
export async function createFestivalDay(data: CreateFestivalDayData): Promise<FestivalDayType> {
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

  const result = {
    _id: festivalDay._id.toString(),
    date: festivalDay.date,
    label: festivalDay.label,
    description: festivalDay.description,
    isActive: festivalDay.isActive,
    order: festivalDay.order,
    createdAt: festivalDay.createdAt.toISOString(),
    updatedAt: festivalDay.updatedAt.toISOString(),
  };

  // Broadcast update
  await broadcast('FESTIVAL_DAY_CREATED', {
    type: 'FESTIVAL_DAY_CREATED',
    data: result,
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * Aktualisiert einen Festival-Tag
 */
export async function updateFestivalDay(id: string, data: UpdateFestivalDayData): Promise<FestivalDayType> {
  const festivalDay = await FestivalDay.findById(id);
  if (!festivalDay) {
    throw new Error('Festival-Tag nicht gefunden');
  }

  // Update fields
  if (data.date !== undefined) festivalDay.date = data.date;
  if (data.label !== undefined) festivalDay.label = data.label;
  if (data.description !== undefined) festivalDay.description = data.description;
  if (data.isActive !== undefined) festivalDay.isActive = data.isActive;
  if (data.order !== undefined) festivalDay.order = data.order;

  await festivalDay.save();

  const result = {
    _id: festivalDay._id.toString(),
    date: festivalDay.date,
    label: festivalDay.label,
    description: festivalDay.description,
    isActive: festivalDay.isActive,
    order: festivalDay.order,
    createdAt: festivalDay.createdAt.toISOString(),
    updatedAt: festivalDay.updatedAt.toISOString(),
  };

  // Broadcast update
  await broadcast('FESTIVAL_DAY_UPDATED', {
    type: 'FESTIVAL_DAY_UPDATED',
    data: result,
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * Löscht einen Festival-Tag
 */
export async function deleteFestivalDay(id: string): Promise<void> {
  const festivalDay = await FestivalDay.findById(id);
  if (!festivalDay) {
    throw new Error('Festival-Tag nicht gefunden');
  }

  await festivalDay.deleteOne();

  // Broadcast deletion
  await broadcast('FESTIVAL_DAY_DELETED', {
    type: 'FESTIVAL_DAY_DELETED',
    data: { festivalDayId: id },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Ändert die Reihenfolge der Festival-Tage
 */
export async function reorderFestivalDays(dayIds: string[]): Promise<void> {
  const updates = dayIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { order: index + 1 },
    },
  }));

  await FestivalDay.bulkWrite(updates);

  // Broadcast reorder
  await broadcast('FESTIVAL_DAYS_REORDERED', {
    type: 'FESTIVAL_DAYS_REORDERED',
    data: { dayIds },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Initialisiert Standard-Festival-Tage falls keine vorhanden
 */
export async function initDefaultFestivalDays(): Promise<void> {
  const existingDays = await FestivalDay.countDocuments();
  
  if (existingDays === 0) {
    // Erstelle Standard-Tage für ein typisches Festival
    const defaultDays = [
      {
        date: new Date('2024-07-19'),
        label: 'Freitag - Aufbau',
        description: 'Aufbau und Vorbereitung',
        isActive: true,
        order: 1,
      },
      {
        date: new Date('2024-07-20'),
        label: 'Samstag - Festival Tag 1',
        description: 'Erster Festival-Tag',
        isActive: true,
        order: 2,
      },
      {
        date: new Date('2024-07-21'),
        label: 'Sonntag - Festival Tag 2',
        description: 'Zweiter Festival-Tag',
        isActive: true,
        order: 3,
      },
      {
        date: new Date('2024-07-22'),
        label: 'Montag - Abbau',
        description: 'Abbau und Aufräumen',
        isActive: true,
        order: 4,
      },
    ];

    await FestivalDay.insertMany(defaultDays);
  }
} 