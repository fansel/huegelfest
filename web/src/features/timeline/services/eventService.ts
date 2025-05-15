import { Event, IEvent } from '@/lib/db/models/Event';
import { Types } from 'mongoose';

export async function createEvent(data: Record<string, any>) {
  const event = new Event(data);
  await event.save();
  const plain = await Event.findById(event._id).lean();
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
  return deepObjectIdToString(updated);
}

export async function deleteEvent(eventId: string) {
  return Event.findByIdAndDelete(eventId);
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