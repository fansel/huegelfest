import Agenda, { Job } from 'agenda';
import { connectDB } from '../db/connector';
import { logger } from '../logger';
import { webPushService } from '../webpush/webPushService';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import { Subscriber } from '../db/models/Subscriber';
import { initWebpush } from '../initWebpush';
import mongoose from 'mongoose';
import { Group, IGroup } from '../db/models/Group';

interface SendPushEventData { eventId: string; }

const mongoUri = `mongodb://${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DB || 'huegelfest'}`;

connectDB()
  .then(() => logger.info('[Agenda] Mongoose verbunden'))
  .catch(err => { logger.error('[Agenda] Verbindungsfehler:', err);
  });

const agenda = new Agenda({
  db: { address: mongoUri, collection: 'agendaJobs' },
  processEvery: '30 seconds',
  defaultConcurrency: 5,
  maxConcurrency: 20,
  defaultLockLifetime: 600000,
});

agenda.define('sendPushEvent', async (job: Job<SendPushEventData>) => {
  const { eventId } = job.attrs.data;
  const event = await ScheduledPushEvent.findById(eventId).lean();
  if (!event || !event.active) {
    console.log(`[agenda] PushEvent ${eventId} nicht gefunden oder inaktiv – überspringe.`);
    return;
  }

  await initWebpush();
  if (!webPushService.isInitialized()) {
    console.log(`[agenda] WebPush nicht initialisiert – überspringe.`);
    return;
  }

  // 1. Allgemeine Nachrichten (z.B. Ankündigungen) – an alle aktiven Subscriptions
  if (event.type === 'general') {
    const subscribers = await Subscriber.find({}).lean();
    const uniqueSubscribers = deduplicateSubscribers(subscribers);
    await webPushService.sendNotificationToAll({ title: event.title, body: event.body });
    console.log(`[agenda] Allgemeine Push-Nachricht („${event.title}") an alle (${uniqueSubscribers.length} unique Subscriber) gesendet.`);
  }

  // 2. User-spezifische Nachrichten (z.B. Erinnerungen, Aufgaben) – nur an eingeloggte User (Session aktiv) auf dem Gerät
  else if (event.type === 'user' && event.targetUserId) {
    const subscribers = await Subscriber.find({ userId: event.targetUserId }).lean();
    const uniqueSubscribers = deduplicateSubscribers(subscribers);
    await webPushService.sendNotificationToUser(event.targetUserId, { title: event.title, body: event.body });
    console.log(`[agenda] User-Push („${event.title}") an User ${event.targetUserId} (${uniqueSubscribers.length} unique Subscriber) gesendet.`);
  }

  // 3. Gruppenbasierte Nachrichten (z.B. „Eure Aufgabe hat begonnen") – dynamisch an aktuelle Gruppenmitglieder
  else if (event.type === 'group' && event.groupId) {
    const group = await Group.findById(event.groupId).populate('members').lean();
    if (!group) {
      console.log(`[agenda] Gruppe ${event.groupId} nicht gefunden – überspringe Push.`);
      return;
    }
    const memberIds = (group as any).members?.map((m: any) => m._id.toString()) || [];
    const subscribers = await Subscriber.find({ userId: { $in: memberIds } }).lean();
    const uniqueSubscribers = deduplicateSubscribers(subscribers);
    for (const userId of memberIds) {
      await webPushService.sendNotificationToUser(userId, { title: event.title, body: event.body });
    }
    console.log(`[agenda] Gruppen-Push („${event.title}") an Gruppe ${event.groupId} (${uniqueSubscribers.length} unique Subscriber) gesendet.`);
  }

  // 4. (Fallback) – wenn (z.B. alte Events) keine type gesetzt ist, wird wie bisher an alle (unique) Subscriber gesendet
  else {
    const subscribers = (event.subscribers && event.subscribers.length > 0) ? 
      (await Subscriber.find({ _id: { $in: event.subscribers } }).lean()) : 
      (await Subscriber.find({}).lean());
    const uniqueSubscribers = deduplicateSubscribers(subscribers);
    await webPushService.sendNotificationToAll({ title: event.title, body: event.body });
    console.log(`[agenda] Fallback-Push („${event.title}") (ohne type) an alle (${uniqueSubscribers.length} unique Subscriber) gesendet.`);
  }

  // Bei einmaligen Events (repeat: 'once') wird der Job nach erfolgreicher Ausführung deaktiviert.
  if (event.repeat === 'once') {
    await ScheduledPushEvent.findByIdAndUpdate(eventId, { active: false });
    console.log(`[agenda] Einmaliges PushEvent („${event.title}") (${eventId}) deaktiviert.`);
  }
});

// Hilfsfunktion, um Duplikate zu vermeiden
function deduplicateSubscribers(subscribers: any[]): any[] {
  const endpointMap = new Map<string, any>();
  for (const sub of subscribers) {
    if (sub.endpoint && !endpointMap.has(sub.endpoint)) {
      endpointMap.set(sub.endpoint, sub);
    }
  }
  return Array.from(endpointMap.values());
}

agenda
  .on('ready', () => logger.info('[Agenda] Connected & ready'))
  .on('start', job => logger.info(`[Agenda] Job started: ${job.attrs.name}`))
  .on('complete', job => logger.info(`[Agenda] Job completed: ${job.attrs.name}`))
  .on('success', job => logger.info(`[Agenda] Job succeeded: ${job.attrs.name}`))
  .on('fail', (err, job) => logger.error(`[Agenda] Job failed: ${job?.attrs.name}`, err))
  .on('error', err => logger.error('[Agenda] Scheduler error:', err));

(async () => {
  try {
    await agenda.start();
    logger.info('[Agenda] Scheduler is running');
  } catch (err) {
    logger.error('[Agenda] Failed to start scheduler:', err);
    process.exit(1);
  }
})();

setInterval(async () => {
  // Nur bei Änderungen loggen
  const totalJobs = await agenda.jobs({ name: 'sendPushEvent' });
  const openJobs = await agenda.jobs({ name: 'sendPushEvent', nextRunAt: { $ne: null } });
  
  // Statische DEBUG Variable für einfaches Aktivieren/Deaktivieren
  const DEBUG = false;
  
  if (DEBUG) {
    logger.debug(`[Agenda] Push-Jobs Status: ${openJobs.length} offen / ${totalJobs.length} total`);
  }
}, 30000);

export default agenda;
