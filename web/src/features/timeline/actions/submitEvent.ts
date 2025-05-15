"use server";

import { createEvent } from '@/features/timeline/services/eventService';
import { Types } from 'mongoose';
import { sendPushNotificationAction } from '@/features/push/actions/sendPushNotification';

export type EventSubmission = {
  dayId: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
  offeredBy?: string;
};

/**
 * Event-Vorschlag (User-Formular): legt ein neues Event mit Status 'pending' an.
 * Rückgabetyp ist any, da .lean() kein echtes IEvent liefert.
 */
export async function submitEvent(data: Record<string, any>): Promise<any> {
  try {
    // Admin-Events: status/submittedByAdmin werden direkt übernommen, User-Events bekommen defaults
    const isAdmin = data.status === 'approved' && data.submittedByAdmin === true;
    const eventData = {
      dayId: new Types.ObjectId(data.dayId),
      time: data.time,
      title: data.title,
      description: data.description,
      categoryId: new Types.ObjectId(data.categoryId),
      status: isAdmin ? 'approved' : 'pending',
      submittedAt: new Date(),
      submittedByAdmin: isAdmin,
      ...(data.offeredBy ? { offeredBy: data.offeredBy } : {}),
    };
    const event = await createEvent(eventData);
    // event kann Array oder Objekt sein
    const eventObj = Array.isArray(event) ? event[0] : event;
    // Push-Benachrichtigung nur für Admin-Events
    if (isAdmin && eventObj?.title) {
      await sendPushNotificationAction({
        title: 'Neues Event veröffentlicht',
        body: eventObj.title,
        icon: '/icon-192x192.png',
        badge: '/badge-96x96.png',
        data: { type: 'timeline-event', eventId: eventObj._id }
      });
    }
    // Serialisiere alle ObjectIds zu Strings (rekursiv)
    return deepObjectIdToString(event);
  } catch (error) {
    console.error('Fehler beim Erstellen des Events:', error);
    throw new Error('Event konnte nicht erstellt werden.');
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