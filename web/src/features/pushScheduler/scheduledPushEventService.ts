"use server";

import ScheduledPushEvent from '../../lib/db/models/ScheduledPushEvent';
import { getAgendaClient } from '../../lib/pushScheduler/agenda';
import { IScheduledPushEvent } from '../../lib/db/models/ScheduledPushEvent';
import { Types } from 'mongoose';

export async function createScheduledPushEvent(data: Partial<IScheduledPushEvent>) {
  const agenda = await getAgendaClient();
  const event = await ScheduledPushEvent.create(data);

  // Agenda-Job anlegen
  if (event.repeat === 'once' && event.schedule instanceof Date) {
    const job = await agenda.schedule(event.schedule, 'sendPushEvent', { eventId: event._id!.toString() });
    event.agendaJobId = job.attrs._id?.toString();
    await event.save();
  } else if (event.repeat === 'recurring' && typeof event.schedule === 'string') {
    const job = await agenda.every(event.schedule, 'sendPushEvent', { eventId: event._id!.toString() });
    event.agendaJobId = job.attrs._id?.toString();
    await event.save();
  }

  return event;
}

export async function updateScheduledPushEvent(eventId: string, data: Partial<IScheduledPushEvent>) {
  const agenda = await getAgendaClient();
  const event = await ScheduledPushEvent.findById(eventId);
  if (!event) throw new Error('Event not found');

  // Alten Job löschen
  if (event.agendaJobId) {
    try {
      await agenda.cancel({ _id: new Types.ObjectId(event.agendaJobId) });
    } catch (error) {
      console.error(`[PushEventService] Could not cancel job ${event.agendaJobId}, it might not exist.`, error);
    }
  }

  // Event aktualisieren
  Object.assign(event, data);

  // Neuen Job anlegen
  if (event.repeat === 'once' && event.schedule instanceof Date) {
    const job = await agenda.schedule(event.schedule, 'sendPushEvent', { eventId: event._id.toString() });
    event.agendaJobId = job.attrs._id?.toString();
  } else if (event.repeat === 'recurring' && typeof event.schedule === 'string') {
    const job = await agenda.every(event.schedule, 'sendPushEvent', { eventId: event._id.toString() });
    event.agendaJobId = job.attrs._id?.toString();
  } else {
    event.agendaJobId = undefined; // Kein Job wenn kein schedule
  }
  
  await event.save();

  return event;
}

export async function deleteScheduledPushEvent(eventId: string) {
  const agenda = await getAgendaClient();
  const event = await ScheduledPushEvent.findById(eventId);
  if (!event) return;
  if (event.agendaJobId) {
    try {
      await agenda.cancel({ _id: new Types.ObjectId(event.agendaJobId) });
    } catch (error) {
      console.error(`[PushEventService] Could not cancel job ${event.agendaJobId}, it might not exist.`, error);
    }
  }
  await event.deleteOne();
}

/**
 * Bereinigt Push-Events die für vergangene Termine erstellt wurden
 * Diese sollten nicht existieren und können sicher gelöscht werden
 */
export async function cleanupPastPushEvents(): Promise<{ deleted: number; cleaned: number }> {
  const agenda = await getAgendaClient();
  const now = new Date();
  
  console.log(`[cleanupPastPushEvents] Starting cleanup for events scheduled before ${now.toISOString()}`);
  
  // Finde alle Events mit schedule in der Vergangenheit
  const pastEvents = await ScheduledPushEvent.find({
    repeat: 'once',
    schedule: { $lt: now },
    active: true
  });
  
  console.log(`[cleanupPastPushEvents] Found ${pastEvents.length} past push events to clean up`);
  
  let deletedJobs = 0;
  let cleanedEvents = 0;
  
  for (const event of pastEvents) {
    try {
      // Lösche Agenda-Job falls vorhanden
      if (event.agendaJobId) {
        await agenda.cancel({ _id: new Types.ObjectId(event.agendaJobId) });
        deletedJobs++;
        console.log(`[cleanupPastPushEvents] Deleted agenda job: ${event.agendaJobId} for event: ${event._id}`);
      }
      
      // Lösche Push-Event
      await event.deleteOne();
      cleanedEvents++;
      
      console.log(`[cleanupPastPushEvents] Deleted past push event: ${event._id} (scheduled for ${event.schedule})`);
    } catch (error) {
      console.error(`[cleanupPastPushEvents] Failed to clean up event ${event._id}:`, error);
    }
  }
  
  console.log(`[cleanupPastPushEvents] Cleanup complete: ${cleanedEvents} events deleted, ${deletedJobs} agenda jobs cancelled`);
  
  return { deleted: cleanedEvents, cleaned: deletedJobs };
}
