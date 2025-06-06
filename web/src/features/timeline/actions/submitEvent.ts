"use server";

import { Event, IEvent } from '@/lib/db/models/Event';
import { Category } from '@/lib/db/models/Category';
import { FestivalDay } from '@/lib/db/models/FestivalDay';
import { sendPushNotificationAction } from '@/features/push/actions/sendPushNotification';
import { logger } from '@/lib/logger';
import { initServices } from '@/lib/initServices';
import { webPushService } from '@/lib/webpush/webPushService';

interface EventSubmission {
  dayId: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
  status?: 'pending' | 'approved';
  submittedByAdmin?: boolean;
  offeredBy?: string;
}

interface EventCreationError extends Error {
  code: 'VALIDATION_ERROR' | 'DATABASE_ERROR' | 'PUSH_NOTIFICATION_ERROR';
  details?: unknown;
}

/**
 * Event-Vorschlag (User-Formular): legt ein neues Event mit Status 'pending' an.
 * Rückgabetyp ist any, da .lean() kein echtes IEvent liefert.
 */
export async function submitEvent(data: EventSubmission): Promise<IEvent> {
  try {
    // Validiere die Eingabedaten
    const { dayId, categoryId, ...rest } = data;
    
    // Prüfe ob die Referenzen existieren
    const [day, category] = await Promise.all([
      FestivalDay.findById(dayId),
      Category.findById(categoryId)
    ]);
    
    if (!day) throw new Error(`Festival day ${dayId} not found`);
    if (!category) throw new Error(`Category ${categoryId} not found`);

    // Nur submittedByAdmin prüfen, nicht den Status
    const isAdmin = data.submittedByAdmin === true;
    
    const event = await Event.create({
      ...rest,
      dayId,
      categoryId,
      status: isAdmin ? 'approved' : 'pending',
      submittedAt: new Date(),
      submittedByAdmin: isAdmin
    });

    // Push-Benachrichtigung für direkt von Admins erstellte Events
    if (isAdmin && event.title) {
      try {
        // Stelle sicher, dass Services initialisiert sind
        await initServices();
        
        // Prüfe ob WebPush-Service verfügbar ist
        if (!webPushService.isInitialized()) {
          logger.warn('[submitEvent] WebPush-Service ist nicht initialisiert, keine Push-Benachrichtigung gesendet', {
            eventId: event._id,
            title: event.title
          });
        } else {
          await sendPushNotificationAction({
            title: 'Neues Event veröffentlicht',
            body: event.title,
            icon: '/icon-192x192.png',
            badge: '/badge-96x96.png',
            data: { type: 'timeline-event', eventId: event._id.toString() }
          });
          logger.info('[submitEvent] Push notification sent for admin-created event', { 
            eventId: event._id,
            title: event.title
          });
        }
      } catch (error) {
        logger.error('[submitEvent] Push notification failed for admin-created event', { 
          eventId: event._id,
          error 
        });
        // Fehler nicht weiterwerfen - Event wurde trotzdem erstellt
      }
    }

    return event;
  } catch (error) {
    const eventError = new Error('Event konnte nicht erstellt werden.') as EventCreationError;
    
    if (error instanceof Error) {
      eventError.code = 'VALIDATION_ERROR';
      eventError.details = error.message;
    } else {
      eventError.code = 'DATABASE_ERROR';
      eventError.details = error;
    }
    
    logger.error('[submitEvent] Failed to create event', { 
      error: eventError,
      input: data 
    });
    
    throw eventError;
  }
}

// Utility: Rekursive Serialisierung aller ObjectIds zu Strings
function deepObjectIdToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepObjectIdToString);
  }
  if (obj && typeof obj === 'object') {
    if (
      obj.constructor &&
      (obj.constructor.name === 'ObjectId' || obj.constructor.name === 'ObjectID')
    ) {
      return obj.toString();
    }
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return obj;
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = deepObjectIdToString(obj[key]);
    }
    return result;
  }
  return obj;
} 