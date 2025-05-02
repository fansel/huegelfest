'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '../../database/config/connector';
import Timeline from '../../database/models/Timeline';
import Category from '../../database/models/Category';
import { TimelineData } from '@/types/types';
import { logger } from '@/server/lib/logger';

export async function loadTimeline(): Promise<TimelineData> {
  try {
    await connectDB();
    const timeline = await Timeline.findOne().lean();
    if (!timeline) {
      return {
        id: '',
        days: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return {
      ...timeline,
      id: timeline._id.toString(),
      days: timeline.days.map(day => ({
        ...day,
        id: day._id.toString(),
        events: day.events.map(event => ({
          ...event,
          id: event._id.toString(),
        })),
      })),
    };
  } catch (error) {
    logger.error('[Server Action] Fehler beim Laden der Timeline:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Laden der Timeline: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Laden der Timeline aufgetreten');
  }
}

export async function saveTimeline(timeline: TimelineData): Promise<void> {
  try {
    await connectDB();

    // Stelle sicher, dass die "Sonstiges"-Kategorie existiert
    const otherCategory = await Category.findOne({ value: 'other' });
    if (!otherCategory) {
      throw new Error('Kategorie "Sonstiges" nicht gefunden');
    }

    const timelineToSave = {
      days: timeline.days.map(day => ({
        title: day.title,
        description: day.description,
        date: day.date,
        events: day.events.map(event => ({
          time: event.time,
          title: event.title,
          description: event.description,
          categoryId: event.categoryId || 'other',
        })),
      })),
    };

    await Timeline.deleteMany({});
    await Timeline.create(timelineToSave);
    revalidatePath('/');
    logger.info('[Server Action] Timeline erfolgreich gespeichert');
  } catch (error) {
    logger.error('[Server Action] Fehler beim Speichern der Timeline:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Speichern der Timeline: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Speichern der Timeline aufgetreten');
  }
} 