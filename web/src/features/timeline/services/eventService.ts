import { Event, IEvent } from '@/lib/db/models/Event';
import { Types } from 'mongoose';
import { broadcast } from '@/lib/websocket/broadcast';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { Day } from '@/lib/db/models/Day';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export async function createEvent(data: Record<string, any>) {
  const event = new Event(data);
  await event.save();
  await broadcast('event-created', { eventId: event._id.toString(), dayId: event.dayId?.toString() });
  const plain = await Event.findById(event._id).lean();

  // --- Push-Event automatisch anlegen ---
  // Hole das Datum des Tages
  const day = await Day.findById(event.dayId);
  if (day) {
    // 1. UTC-Datum aus DB holen
    const utcDate = day.date;
    // 2. In lokale Zeit (Europe/Berlin) umwandeln
    const berlinDate = toZonedTime(utcDate, 'Europe/Berlin');
    // 3. Lokales Datum als String im Format 'yyyy-MM-dd'
    const datePart = format(berlinDate, 'yyyy-MM-dd', { timeZone: 'Europe/Berlin' });
    // 4. Mit Uhrzeit kombinieren
    const localDateTime = `${datePart}T${event.time}:00`;
    // 5. Wieder in UTC umwandeln
    const eventDate = fromZonedTime(localDateTime, 'Europe/Berlin');

    // Erstelle den Push-Event
    await createScheduledPushEvent({
      title: event.title,
      body: `Programmpunkt "${event.title}" startet jetzt!`,
      repeat: 'once',
      schedule: eventDate,
      active: true,
      sendToAll: true,
    });
  }
  // --- Ende Push-Event-Logik ---

  return plain;
}

/**
 * Gibt Events eines Tages zurück, optional nach Status gefiltert.
 */
export async function getEventsByDay(dayId: string, status?: 'pending' | 'approved' | 'rejected') {
  const filter: any = { dayId: new Types.ObjectId(dayId) };
  if (status) filter.status = status;
  const events = await Event.find(filter).sort({ time: 1 }).lean();
  return events.map(deepObjectIdToString);
}

export async function getPendingEvents() {
  return Event.find({ status: 'pending' }).sort({ submittedAt: 1 }).lean();
}

export async function updateEvent(eventId: string, data: Partial<IEvent>) {
  const updated = await Event.findByIdAndUpdate(eventId, data, { new: true }).lean();
  if (updated) {
    await broadcast('event-updated', { eventId: updated._id.toString(), dayId: updated.dayId?.toString() });
  }
  return deepObjectIdToString(updated);
}

export async function deleteEvent(eventId: string) {
  const deleted = await Event.findByIdAndDelete(eventId);
  if (deleted) {
    await broadcast('event-deleted', { eventId, dayId: deleted.dayId?.toString() });
  }
  return deleted;
}

export async function getEventById(eventId: string) {
  const event = await Event.findById(eventId).lean();
  return deepObjectIdToString(event);
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