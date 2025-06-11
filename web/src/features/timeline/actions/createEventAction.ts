"use server";

import { Types } from 'mongoose';
import { createEvent } from '../services/eventService';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { logger } from '@/lib/logger';
import { initServices } from '@/lib/initServices';

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

export async function createEventAction(data: Record<string, any>) {
  try {
    // Determine if this is an admin-created event
    const isAdminEvent = data.submittedByAdmin === true;
    
    // Ensure all required fields are present with proper logic
    const eventData = {
      ...data,
      submittedAt: new Date(), // Add the required submittedAt field
      status: isAdminEvent ? 'approved' : 'pending', // Admin events are approved, user events are pending
      submittedByAdmin: isAdminEvent, // Use the provided value or default to false
      // Ensure ObjectIds are properly converted
      dayId: typeof data.dayId === 'string' ? new Types.ObjectId(data.dayId) : data.dayId,
      categoryId: typeof data.categoryId === 'string' ? new Types.ObjectId(data.categoryId) : data.categoryId,
    };
    
    const event = await createEvent(eventData);
    
    // Push-Benachrichtigung für direkt von Admins erstellte Events
    if (isAdminEvent && event.title) {
      try {
        await initServices(); // Stellt sicher, dass DB-Verbindung etc. da ist

        await createScheduledPushEvent({
          title: 'Neues Event veröffentlicht',
          body: event.title,
          repeat: 'once',
          schedule: new Date(), // Sofort ausführen
          active: true,
          sendToAll: true,
          type: 'general',
          data: { type: 'timeline-event', eventId: event._id.toString() }
        });

        logger.info('[createEventAction] Push notification scheduled for admin-created event', {
          eventId: event._id.toString(),
          title: event.title
        });
      } catch (error) {
        logger.error('[createEventAction] Push notification scheduling failed for admin-created event', {
          eventId: event._id.toString(),
          error
        });
        // Fehler nicht weiterwerfen - Event wurde trotzdem erstellt
      }
    }
    
    // Serialize ObjectIds to strings for Client Components
    const serializedEvent = deepObjectIdToString(event);
    
    return { success: true, event: serializedEvent };
  } catch (error: any) {
    console.error('[createEventAction] Fehler:', error);
    return { success: false, error: error.message || 'Fehler beim Erstellen des Events' };
  }
} 