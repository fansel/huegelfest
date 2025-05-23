import ScheduledPushEvent from '../../lib/db/models/ScheduledPushEvent';
import agenda from '../../lib/pushScheduler/agenda';
import { IScheduledPushEvent } from '../../lib/db/models/ScheduledPushEvent';

export async function createScheduledPushEvent(data: Partial<IScheduledPushEvent>) {
  const event = await ScheduledPushEvent.create(data);

  // Agenda-Job anlegen
  if (event.repeat === 'once' && event.schedule instanceof Date) {
    const job = await agenda.schedule(event.schedule, 'sendPushEvent', { eventId: event._id });
    event.agendaJobId = job.attrs._id.toString();
    await event.save();
  } else if (event.repeat === 'recurring' && typeof event.schedule === 'string') {
    const job = await agenda.every(event.schedule, 'sendPushEvent', { eventId: event._id });
    event.agendaJobId = job.attrs._id.toString();
    await event.save();
  }

  return event;
}

export async function updateScheduledPushEvent(eventId: string, data: Partial<IScheduledPushEvent>) {
  const event = await ScheduledPushEvent.findById(eventId);
  if (!event) throw new Error('Event not found');

  // Alten Job löschen
  if (event.agendaJobId) {
    await agenda.cancel({ _id: event.agendaJobId });
  }

  // Event aktualisieren
  Object.assign(event, data);
  await event.save();

  // Neuen Job anlegen
  if (event.repeat === 'once' && event.schedule instanceof Date) {
    const job = await agenda.schedule(event.schedule, 'sendPushEvent', { eventId: event._id });
    event.agendaJobId = job.attrs._id.toString();
    await event.save();
  } else if (event.repeat === 'recurring' && typeof event.schedule === 'string') {
    const job = await agenda.every(event.schedule, 'sendPushEvent', { eventId: event._id });
    event.agendaJobId = job.attrs._id.toString();
    await event.save();
  }

  return event;
}

export async function deleteScheduledPushEvent(eventId: string) {
  const event = await ScheduledPushEvent.findById(eventId);
  if (!event) return;
  if (event.agendaJobId) {
    await agenda.cancel({ _id: event.agendaJobId });
  }
  await event.deleteOne();
}
