import { Day, IDay } from '@/lib/db/models/Day';
import { connectDB } from '@/lib/db/connector';
import { broadcast } from '@/lib/websocket/broadcast';

export async function createDay(data: { title: string; description?: string; date: Date }) {
  console.log('[createDay] Eingabedaten:', data);
  const day = new Day(data);
  await day.save();
  console.log('[createDay] Gespeichert:', day);
  await broadcast('day-created', { dayId: day._id.toString() });
  return day;
}

export async function getDays() {
  await connectDB();
  const result = await Day.find().sort({ date: 1 }).lean();
  console.log('[getDays] Gefundene Tage:', result);
  return result;
}

export async function updateDay(dayId: string, data: Partial<IDay>) {
  const updatedDay = await Day.findByIdAndUpdate(dayId, data, { new: true }).lean();
  if (updatedDay) {
    await broadcast('day-updated', { dayId: updatedDay._id.toString() });
  }
  return updatedDay;
}

export async function deleteDay(dayId: string) {
  const deleted = await Day.findByIdAndDelete(dayId);
  if (deleted) {
    await broadcast('day-deleted', { dayId });
  }
  return deleted;
}

export async function getDayById(dayId: string) {
  await connectDB();
  const day = await Day.findById(dayId).lean();
  if (!day) return null;
  // Events für diesen Tag laden
  const events = await import('../services/eventService').then(m => m.getEventsByDay(dayId, 'approved'));
  // IDs in Strings umwandeln
  const plainDay = {
    ...day,
    _id: typeof day._id === 'string' ? day._id : (day._id?.toString?.() ?? ''),
    events: Array.isArray(events)
      ? events.map((event: any) => ({
          ...event,
          _id: typeof event._id === 'string' ? event._id : (event._id?.toString?.() ?? ''),
          dayId: typeof event.dayId === 'string' ? event.dayId : (event.dayId?.toString?.() ?? ''),
        }))
      : [],
  };
  return plainDay;
} 