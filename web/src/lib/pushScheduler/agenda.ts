import Agenda, { Job } from 'agenda';
import mongoose from 'mongoose';
import { connectDB } from '../db/connector';
import { logger } from '../logger';
import { webPushService } from '../webpush/webPushService';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import { Subscriber } from '../db/models/Subscriber';

const mongoConnectionString = `mongodb://${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DB || 'huegelfest'}`;

export const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  processEvery: '30 seconds',
  defaultConcurrency: 5,
  maxConcurrency: 20,
});

// Beispiel-Job-Definition: Push-Event senden
agenda.define('sendPushEvent', async (job: Job) => {
  console.log('[Agenda] sendPushEvent Job gestartet');
  const { eventId } = job.attrs.data as { eventId: string };
  console.log('[Agenda] Event ID', eventId);
  if (!eventId) return;

  // Event aus DB holen
  const event = await ScheduledPushEvent.findById(eventId);
  console.log('[Agenda] Event aus DB holen', event);
  if (!event || !event.active) return;

  let subscribers;
  if (event.sendToAll) {
    subscribers = await Subscriber.find({});
    console.log('[Agenda] Subscriber finden', subscribers);
  } else {
    subscribers = await Subscriber.find({ _id: { $in: event.subscribers } });
    console.log('[Agenda] Subscriber finden', subscribers);
  }

  for (const subscriber of subscribers) {
    if (!subscriber.endpoint) continue;
    console.log('[Agenda] Subscriber', subscriber);
    try {
      await webPushService.sendNotification(subscriber, { title: event.title, body: event.body });

      console.log(`[Agenda] Push-Event: ${event.title} mit ID ${eventId} und body ${event.body} an ${subscriber.id} gesendet`);
    } catch (err) {
      console.error(`[Agenda] Fehler beim Senden von Push-Event an ${subscriber.id}: ${err}`);
    }
  }
});

// Agenda-Initialisierung (z.B. beim Server-Start)
export const startAgenda = async () => {
  console.log('[Agenda] startAgenda() wird aufgerufen');
  await connectDB();
  // Sicherstellen, dass die DB-Connection existiert
  console.log('[Agenda] Mongoose-DB-Connection', mongoose.connection.db);
  if (!mongoose.connection.db) {
    throw new Error('[Agenda] Mongoose-DB-Connection nicht verfügbar!');
  }
  // @ts-expect-error Typen sind inkompatibel, aber zur Laufzeit funktioniert es
  agenda.mongo(mongoose.connection.db, 'agendaJobs');
  try {
    console.log('[Agenda] Starte agenda.start()');
    const startPromise = agenda.start();
    setTimeout(() => {
      console.log('[Agenda] agenda.start() läuft immer noch nach 10 Sekunden');
    }, 10000);
    await startPromise;
    console.log('[Agenda] Scheduler gestartet');
  } catch (err) {
    console.error('[Agenda] Fehler beim Starten:', err);
  }
};

agenda.on('error', (err) => {
  console.error('[Agenda] Scheduler error:', err);
});

startAgenda();




