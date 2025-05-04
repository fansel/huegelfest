'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '../../database/config/apiConnector';
import { Timeline } from '@/database/models/Timeline';
import { Category } from '../../database/models/Category';
import { TimelineData } from '@/types/types';
import { logger } from '@/server/lib/logger';
import mongoose from 'mongoose';
import { webPushService } from '@/server/lib/lazyServices';

export async function loadTimeline(): Promise<TimelineData> {
  try {
    await connectDB();
    const timeline = await Timeline.findOne().lean();
    if (!timeline) {
      return {
        days: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Lade alle Kategorien
    const categories = await Category.find().lean();
    const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat.value]));

    // Konvertiere MongoDB-Objekte zu einfachen Strings
    return {
      days: timeline.days.map(day => ({
        title: day.title,
        description: day.description,
        date: day.date.toISOString(),
        events: day.events.map(event => {
          const categoryId = event.categoryId ? event.categoryId.toString() : 'other';
          return {
            time: event.time,
            title: event.title,
            description: event.description,
            categoryId: categoryMap.get(categoryId) || 'other'
          };
        })
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

    // Lade alle Kategorien
    const categories = await Category.find().lean();
    const categoryMap = new Map(categories.map(cat => [cat.value, cat._id]));

    // Stelle sicher, dass die "Sonstiges"-Kategorie existiert
    const otherCategory = categories.find(cat => cat.value === 'other');
    if (!otherCategory) {
      throw new Error('Kategorie "Sonstiges" nicht gefunden');
    }

    const timelineToSave = {
      days: timeline.days.map(day => {
        // Validiere das Datum
        if (!day.date) {
          throw new Error('Datum ist erforderlich');
        }
        const date = typeof day.date === 'string' ? new Date(day.date) : day.date;
        if (isNaN(date.getTime())) {
          throw new Error(`Ungültiges Datum: ${day.date}`);
        }

        // Validiere die Events
        const validatedEvents = day.events.map(event => {
          if (!event.time || !event.title || !event.description) {
            throw new Error('Alle Event-Felder (Zeit, Titel, Beschreibung) sind erforderlich');
          }

          // Validiere das Zeitformat
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(event.time)) {
            throw new Error(`Ungültiges Zeitformat: ${event.time}`);
          }

          // Finde die Kategorie anhand des value Feldes
          let categoryId;
          try {
            const categoryValue = typeof event.categoryId === 'string' 
              ? event.categoryId 
              : event.categoryId.$oid;

            if (categoryValue === 'other') {
              categoryId = otherCategory._id;
            } else {
              // Suche die Kategorie in der Map
              const foundCategoryId = categoryMap.get(categoryValue);
              if (!foundCategoryId) {
                logger.warn(`Kategorie mit value "${categoryValue}" nicht gefunden, verwende "other"`);
                categoryId = otherCategory._id;
              } else {
                categoryId = foundCategoryId;
              }
            }
          } catch (error) {
            logger.error(`Fehler beim Finden der Kategorie: ${event.categoryId}`, error);
            categoryId = otherCategory._id;
          }

          return {
            time: event.time,
            title: event.title,
            description: event.description,
            categoryId: categoryId,
          };
        });

        return {
          title: day.title,
          description: day.description,
          date: date,
          events: validatedEvents,
        };
      }),
    };

    // Lösche die alte Timeline und erstelle eine neue
    await Timeline.deleteMany({});
    await Timeline.create(timelineToSave);
    
    // Revalidiere die relevanten Pfade
    revalidatePath('/');
    revalidatePath('/timeline');
    revalidatePath('/admin');
    
    // Sende Push-Benachrichtigung
    try {
      const service = await webPushService.getInstance();
      if (service.isInitialized()) {
        await service.sendNotificationToAll({
          title: 'Timeline aktualisiert',
          body: 'Das Programm wurde aktualisiert',
          icon: '/icon-192x192.png',
          badge: '/badge-96x96.png',
          data: {
            url: '/'
          }
        });
      }
    } catch (error) {
      logger.error('[Server Action] Fehler beim Senden der Push-Benachrichtigung:', error);
      // Fehler beim Senden der Push-Benachrichtigung sollte das Speichern nicht beeinflussen
    }
    
    logger.info('[Server Action] Timeline erfolgreich gespeichert');
  } catch (error) {
    logger.error('[Server Action] Fehler beim Speichern der Timeline:', error);
    if (error instanceof Error) {
      throw new Error(`Fehler beim Speichern der Timeline: ${error.message}`);
    }
    throw new Error('Ein unerwarteter Fehler ist beim Speichern der Timeline aufgetreten');
  }
} 