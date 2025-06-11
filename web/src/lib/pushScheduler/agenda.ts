import Agenda, { Job } from 'agenda';
import mongoose from 'mongoose';
import { connectDB } from '../db/connector';
import { logger } from '../logger';
import { webPushService } from '../webpush/webPushService';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import { Subscriber } from '../db/models/Subscriber';
import { initWebpush } from '../initWebpush';
import { Group } from '../db/models/Group';

interface SendPushEventData { eventId: string; }

interface SendAnnouncementNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

const mongoUri = `mongodb://${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DB || 'huegelfest'}`;

let agenda: Agenda | null = null;

const defineJobs = (agendaInstance: Agenda) => {
  agendaInstance.define('send-announcement-notification', async (job: Job<SendAnnouncementNotificationData>) => {
    await initWebpush();
    if (!webPushService.isInitialized()) {
      logger.error('[Agenda] WebPush not initialized, skipping announcement push.');
      return;
    }
    const { title, body, icon, badge, data } = job.attrs.data;
    await webPushService.sendNotificationToAll({ title, body, icon, badge, data });
  });

  agendaInstance.define('sendPushEvent', async (job: Job<SendPushEventData>) => {
    const { eventId } = job.attrs.data;
    const event = await ScheduledPushEvent.findById(eventId).lean();
    if (!event || !event.active) {
      logger.info(`[agenda] PushEvent ${eventId} nicht gefunden oder inaktiv – überspringe.`);
      job.remove();
      return;
    }

    await initWebpush();
    if (!webPushService.isInitialized()) {
      logger.warn(`[agenda] WebPush nicht initialisiert – überspringe.`);
      return;
    }

    logger.info(`[agenda] Verarbeite PushEvent ${eventId} vom Typ ${event.type}`);

    // 1. Allgemeine Nachrichten (z.B. Ankündigungen) – an alle aktiven Subscriptions
    if (event.type === 'general') {
      await webPushService.sendNotificationToAll({ title: event.title, body: event.body });
      logger.info(`[agenda] Allgemeine Push-Nachricht („${event.title}") an alle gesendet.`);
    }

    // 2. User-spezifische Nachrichten (z.B. Erinnerungen, Aufgaben) – nur an eingeloggte User (Session aktiv) auf dem Gerät
    else if (event.type === 'user' && event.targetUserId) {
      await webPushService.sendNotificationToUser(event.targetUserId.toString(), { title: event.title, body: event.body });
      logger.info(`[agenda] User-Push („${event.title}") an User ${event.targetUserId} gesendet.`);
    }

    // 3. Gruppenbasierte Nachrichten (z.B. „Eure Aufgabe hat begonnen") – dynamisch an aktuelle Gruppenmitglieder
    else if (event.type === 'group' && event.groupId) {
      const group = await Group.findById(event.groupId).populate('members').lean();
      if (!group) {
        logger.warn(`[agenda] Gruppe ${event.groupId} nicht gefunden – überspringe Push.`);
        return;
      }
      const memberIds = (group as any).members?.map((m: any) => m._id.toString()) || [];
      for (const userId of memberIds) {
        await webPushService.sendNotificationToUser(userId, { title: event.title, body: event.body });
      }
      logger.info(`[agenda] Gruppen-Push („${event.title}") an Gruppe ${group.name} (${memberIds.length} Mitglieder) gesendet.`);
    }

    // Wenn es ein einmaliger Job ist, entferne ihn nach Ausführung
    if (event.repeat === 'once') {
        logger.info(`[agenda] Einmaliger Job ${job.attrs.name} für Event ${eventId} wird nach Ausführung entfernt.`);
        job.remove();
    }
  });

  logger.info('[Agenda] Jobs defined');
};

const setupEventListeners = (agendaInstance: Agenda) => {
    agendaInstance
        .on('ready', () => logger.info('[Agenda] Connected & ready'))
        .on('start', job => logger.info(`[Agenda] Job started: ${job.attrs.name} (${job.attrs._id})`))
        .on('complete', job => logger.info(`[Agenda] Job completed: ${job.attrs.name} (${job.attrs._id})`))
        .on('success', job => logger.info(`[Agenda] Job succeeded: ${job.attrs.name} (${job.attrs._id})`))
        .on('fail', (err, job) => logger.error(`[Agenda] Job failed: ${job?.attrs.name} (${job?.attrs._id})`, { error: err.message }))
        .on('error', err => logger.error('[Agenda] Scheduler error:', { error: err.message }));
}

export const initializeAgenda = async (): Promise<Agenda> => {
    if (agenda) {
        logger.info('[Agenda] Scheduler already initialized.');
        return agenda;
    }

    logger.info('[Agenda] Initializing scheduler...');

    try {
        await connectDB();
        logger.info('[Agenda] Database connection established.');
    } catch (err) {
        logger.error('[Agenda] Failed to connect to DB for scheduler:', err);
        throw err; // Re-throw to prevent startup
    }
    
    const newAgenda = new Agenda({
        db: { address: mongoUri, collection: 'agendaJobs' },
        processEvery: '30 seconds',
        defaultConcurrency: 5,
        maxConcurrency: 20,
        defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
    });

    defineJobs(newAgenda);
    setupEventListeners(newAgenda);
    
    await newAgenda.start();
    logger.info('[Agenda] Scheduler started successfully.');

    // Graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown(newAgenda));
    process.on('SIGINT', () => gracefulShutdown(newAgenda));
    
    agenda = newAgenda;
    return agenda;
};

const gracefulShutdown = async (agendaInstance: Agenda) => {
    logger.info('[Agenda] Stopping scheduler...');
    await agendaInstance.stop();
    logger.info('[Agenda] Scheduler stopped.');
    process.exit(0);
};

// Bereinigungsfunktion für verwaiste Jobs beim Start
export const cleanupStaleJobs = async () => {
    if (!agenda) {
        logger.warn('[Agenda] Cannot cleanup stale jobs, scheduler not initialized.');
        return;
    }
    logger.info('[Agenda] Cleaning up stale or stuck jobs...');
    // Logik, um Jobs zu finden, die "locked" sind, aber nicht mehr laufen
    // Diese Implementierung hängt von der genauen Anforderung ab.
    // Ein einfacher Ansatz wäre, sehr alte, gesperrte Jobs freizugeben.
    const jobs = await agenda.jobs({ lockedAt: { $exists: true, $ne: null } });
    let unlockedCount = 0;
    for (const job of jobs) {
        if (job.attrs.lockedAt && job.attrs.lockedAt < new Date(Date.now() - 15 * 60 * 1000)) { // älter als 15 min
            logger.warn(`[Agenda] Unlocking stale job: ${job.attrs.name} (${job.attrs._id}) locked at ${job.attrs.lockedAt}`);
            job.attrs.lockedAt = null;
            await job.save();
            unlockedCount++;
        }
    }
    if (unlockedCount > 0) {
        logger.info(`[Agenda] Unlocked ${unlockedCount} stale jobs.`);
    }
}

const getAgenda = (): Agenda => {
    if (!agenda) {
        throw new Error('Agenda has not been initialized. Call initializeAgenda() first.');
    }
    return agenda;
}

export default getAgenda;
