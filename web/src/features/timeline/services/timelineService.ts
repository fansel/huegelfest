import { Timeline, ITimelineDocument } from '@/lib/db/models/Timeline';
import type { TimelineData, Day, Event } from '../types/types';
import { initServices } from '@/lib/initServices';

/**
 * Fehlerobjekt für Service-Methoden
 */
export interface TimelineServiceError {
  error: string;
}

/**
 * Hilfsfunktion: Timeline-Daten bereinigen und für das Frontend aufbereiten
 */
function cleanTimelineData(timeline: any): TimelineData | null {
  if (!timeline) return null;
  return {
    days: timeline.days.map((day: any) => ({
      _id: day._id?.toString?.() ?? day._id,
      title: day.title,
      description: day.description,
      date: typeof day.date === 'string' ? day.date : (day.date instanceof Date ? day.date.toISOString().split('T')[0] : ''),
      events: (day.events || []).map((event: any) => ({
        _id: event._id?.toString?.() ?? event._id,
        time: event.time,
        title: event.title,
        description: event.description,
        categoryId:
          typeof event.categoryId === 'string'
            ? event.categoryId
            : (event.categoryId?.toString?.() ?? ''),
      })),
    }))
  };
}

/**
 * Liefert die aktuelle Timeline
 */
export async function getTimeline(): Promise<TimelineData | TimelineServiceError | null> {
  try {
    await initServices();
    let timeline = await Timeline.findOne({}).sort({ createdAt: -1 }).lean();
    if (!timeline) {
      console.log('[getTimeline] Keine Timeline gefunden, lege neue an.');
      const created = await Timeline.create({ days: [] });
      timeline = await Timeline.findById(created._id).lean();
    } else {
      console.log('[getTimeline] Timeline gefunden:', JSON.stringify(timeline, null, 2));
    }
    const cleaned = cleanTimelineData(timeline);
    console.log('[getTimeline] Cleaned Timeline:', JSON.stringify(cleaned, null, 2));
    return cleaned;
  } catch (error) {
    console.error('[getTimeline] Fehler:', error);
    return { error: 'Fehler beim Laden der Timeline.' };
  }
}

/**
 * Fügt einen Tag hinzu
 */
export async function addDay(day: Day): Promise<TimelineData | TimelineServiceError> {
  try {
    await initServices();
    console.log('[addDay] Eingehender Tag:', JSON.stringify(day, null, 2));
    let timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) {
      timeline = await Timeline.create({ days: [day] });
      console.log('[addDay] Neue Timeline erstellt:', JSON.stringify(timeline, null, 2));
    } else {
      timeline.days.push(day);
      await timeline.save();
      console.log('[addDay] Tag hinzugefügt. Timeline nach dem Speichern:', JSON.stringify(timeline, null, 2));
    }
    // Nach dem Speichern als Plain Object serialisieren
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      console.error('[addDay] Fehler: Timeline konnte nach dem Hinzufügen nicht geladen werden.');
      return { error: 'Timeline konnte nach dem Hinzufügen nicht geladen werden.' };
    }
    return cleaned;
  } catch (error: any) {
    console.error('Fehler im Backend beim Hinzufügen des Tages:', error, error?.message);
    return { error: error?.message || 'Fehler beim Hinzufügen des Tages.' };
  }
}

/**
 * Löscht einen Tag anhand der ID
 */
export async function deleteDay(dayId: string): Promise<TimelineData | TimelineServiceError> {
  console.log('[deleteDay Service] Aufgerufen mit dayId:', dayId);
  try {
    await initServices();
    const timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    console.log('[deleteDay] Timeline gefunden:', timeline ? timeline._id : 'keine Timeline');
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const before = timeline.days.length;
    timeline.days = timeline.days.filter((d: any) => d._id.toString() !== dayId);
    const after = timeline.days.length;
    console.log(`[deleteDay] Tage vor: ${before}, nach: ${after}, gelöscht: ${before - after}`);
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      console.error('[deleteDay] Fehler: Timeline konnte nach dem Löschen nicht geladen werden.');
      return { error: 'Timeline konnte nach dem Löschen nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    console.error('[deleteDay] Fehler:', error);
    return { error: 'Fehler beim Löschen des Tages.' };
  }
}

/**
 * Fügt einem Tag ein Event hinzu
 */
export async function addEventToDay(dayId: string, event: Event): Promise<TimelineData | TimelineServiceError> {
  console.log('[addEventToDay Service] Aufgerufen mit:', { dayId, event });
  try {
    await initServices();
    const timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const day = timeline.days.find((d: any) => d._id.toString() === dayId);
    if (!day) return { error: 'Tag nicht gefunden.' };
    day.events.push({
      ...event,
      description: typeof event.description === 'string' ? event.description : ''
    });
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      return { error: 'Timeline konnte nach dem Hinzufügen des Events nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    return { error: 'Fehler beim Hinzufügen des Events.' };
  }
}

/**
 * Löscht ein Event aus einem Tag
 */
export async function deleteEventFromDay(dayId: string, eventId: string): Promise<TimelineData | TimelineServiceError> {
  console.log('[deleteEventFromDay] dayId:', dayId, 'eventId:', eventId);
  try {
    await initServices();
    const timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const day = timeline.days.find((d: any) => d._id.toString() === dayId);
    if (!day) return { error: 'Tag nicht gefunden.' };
    console.log('[deleteEventFromDay] Events:', day?.events?.map(e => e._id?.toString?.()));
    day.events = day.events.filter((e: any) => e._id?.toString?.() !== eventId?.toString?.());
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      return { error: 'Timeline konnte nach dem Löschen des Events nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    return { error: 'Fehler beim Löschen des Events.' };
  }
}

/**
 * Verschiebt ein Event von einem Tag zu einem anderen
 */
export async function moveEventToAnotherDay(fromDayId: string, toDayId: string, eventId: string): Promise<TimelineData | TimelineServiceError> {
  try {
    await initServices();
    const timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const fromDay = timeline.days.find((d: any) => d._id.toString() === fromDayId);
    const toDay = timeline.days.find((d: any) => d._id.toString() === toDayId);
    if (!fromDay || !toDay) return { error: 'Tag nicht gefunden.' };
    const eventIdx = fromDay.events.findIndex((e: any) => e._id.toString() === eventId);
    if (eventIdx === -1) return { error: 'Event nicht gefunden.' };
    const [event] = fromDay.events.splice(eventIdx, 1);
    toDay.events.push(event);
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      return { error: 'Timeline konnte nach dem Verschieben des Events nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    return { error: 'Fehler beim Verschieben des Events.' };
  }
}

/**
 * Bearbeitet ein Event in einem Tag
 */
export async function editEventInDay(dayId: string, event: Event): Promise<TimelineData | TimelineServiceError> {
  try {
    await initServices();
    const timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const day = timeline.days.find((d: any) => d._id.toString() === dayId);
    if (!day) return { error: 'Tag nicht gefunden.' };
    const eventId = (event._id as any)?.$oid || event._id?.toString?.() || event._id;
    console.log('[editEventInDay] dayId:', dayId, 'eventId:', eventId);
    console.log('[editEventInDay] Events:', day?.events?.map(e => e._id?.toString?.()));
    const idx = day.events.findIndex((e: any) => e._id?.toString?.() === eventId);
    if (idx === -1) return { error: 'Event nicht gefunden.' };
    day.events[idx] = { ...day.events[idx], ...event, description: typeof event.description === 'string' ? event.description : '' };
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    const cleaned = cleanTimelineData(plain);
    if (!cleaned) {
      return { error: 'Timeline konnte nach dem Bearbeiten des Events nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    return { error: 'Fehler beim Bearbeiten des Events.' };
  }
}

export async function updateTimeline(data: TimelineData): Promise<TimelineData | null> {
  await initServices();
  let timeline = await Timeline.findOne({}).sort({ createdAt: -1 });
  if (timeline) {
    timeline.days = data.days;
    await timeline.save();
    const plain = await Timeline.findById(timeline._id).lean();
    return cleanTimelineData(plain);
  } else {
    timeline = await Timeline.create(data);
    const plain = await Timeline.findById(timeline._id).lean();
    return cleanTimelineData(plain);
  }
}

export async function deleteTimeline(id: string): Promise<{ success: boolean; error?: string }> {
  await initServices();
  const timeline = await Timeline.findByIdAndDelete(id);
  if (!timeline) {
    return { success: false, error: 'Timeline nicht gefunden' };
  }
  return { success: true };
}

/**
 * Bearbeitet einen Tag anhand der ID
 */
export async function updateDay(dayId: string, day: Day): Promise<TimelineData | TimelineServiceError> {
  try {
    await initServices();
    const timeline: ITimelineDocument | null = await Timeline.findOne({}).sort({ createdAt: -1 });
    if (!timeline) return { error: 'Timeline nicht gefunden.' };
    const idx = timeline.days.findIndex((d: any) => d._id.toString() === dayId);
    if (idx === -1) return { error: 'Tag nicht gefunden.' };
    timeline.days[idx] = { ...timeline.days[idx], ...day };
    await timeline.save();
    const cleaned = cleanTimelineData(timeline.toObject());
    if (!cleaned) {
      return { error: 'Timeline konnte nach dem Bearbeiten des Tages nicht geladen werden.' };
    }
    return cleaned;
  } catch (error) {
    return { error: 'Fehler beim Bearbeiten des Tages.' };
  }
} 