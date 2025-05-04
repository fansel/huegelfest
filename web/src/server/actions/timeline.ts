'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '../../database/config/apiConnector';
import { Timeline } from '../../database/models/Timeline';
import { Category } from '../../database/models/Category';
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Konvertiere MongoDB-Objekte zu einfachen Strings
    return {
      id: timeline._id.toString(),
      days: timeline.days.map(day => ({
        id: day._id.toString(),
        title: day.title,
        description: day.description,
        date: day.date.toISOString(),
        events: day.events.map(event => ({
          id: event._id.toString(),
          time: event.time,
          title: event.title,
          description: event.description,
          categoryId: event.categoryId.toString()
        }))
      })),
      createdAt: timeline.createdAt.toISOString(),
      updatedAt: timeline.updatedAt.toISOString()
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
      days: timeline.days.map(day => {
        // Setze ein Standarddatum, falls keines vorhanden ist
        const dateStr = day.date || new Date().toISOString().split('T')[0];
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
          throw new Error(`Ungültiges Datum: ${dateStr}`);
        }
        
        return {
          title: day.title || 'Neuer Tag',
          description: day.description || 'Keine Beschreibung verfügbar',
          date: date,
          events: day.events.map(event => ({
            time: event.time || '00:00',
            title: event.title || 'Neues Event',
            description: event.description || 'Keine Beschreibung verfügbar',
            categoryId: otherCategory._id,
          })),
        };
      }),
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