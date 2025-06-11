import { Agenda, Job } from 'agenda';
import mongoose from 'mongoose';
import { connectDB, getMongoUri } from '../db/connector';
import { logger } from '../logger';
import { webPushService } from '../webpush/webPushService';
import { initWebpush } from '../initWebpush';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import { User } from '../db/models/User';

// Data structure for the 'send-announcement-notification' job
export interface SendAnnouncementNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data: {
    type: 'announcement';
    groupId: string;
    announcementId: string;
  };
}

let agenda: Agenda | null = null;
let agendaReady: Promise<Agenda> | null = null;
let isWorker = false;

const AGENDA_COLLECTION = 'agendaJobs';

/**
 * Checks if the full Agenda worker instance is running.
 */
export function isAgendaRunning(): boolean {
	return agenda !== null && isWorker;
}

/**
 * Initializes or retrieves a lightweight Agenda client for scheduling jobs.
 * This instance does not start the scheduler and is safe to use in serverless functions.
 */
export function getAgendaClient(): Promise<Agenda> {
  if (agenda) {
    return Promise.resolve(agenda);
  }
  
  if (agendaReady) {
    return agendaReady;
  }

  agendaReady = (async () => {
    logger.info('[Agenda/Client] Initializing new agenda client...');
    try {
      await connectDB();
      const mongoUri = getMongoUri();
      const newAgenda = new Agenda({
        db: { address: mongoUri, collection: AGENDA_COLLECTION },
      });
      
      agenda = newAgenda;
      isWorker = false;
      
      defineJobs(agenda);

      await newAgenda.start();
      await newAgenda.stop();

      logger.info('[Agenda/Client] Client ready.');
      return agenda;
    } catch (error) {
      logger.error('[Agenda/Client] Failed to initialize Agenda client:', error);
      agendaReady = null;
      throw error;
    }
  })();
  
  return agendaReady;
}

/**
 * Initializes the full Agenda worker instance.
 * This should only be called once in the main, long-running server process.
 */
export function initializeAgendaWorker(): Promise<Agenda> {
	if (agenda) {
    if (isWorker) {
      logger.warn('[Agenda/Worker] Worker already initialized.');
      return Promise.resolve(agenda);
    }
    const err = new Error('An agenda client is already initialized. Stop the client before starting a worker.');
    logger.error('[Agenda/Worker] An agenda client is already initialized. Cannot initialize worker.');
    throw err;
  }

	if (agendaReady) {
		return agendaReady;
	}

  agendaReady = (async () => {
    try {
      await connectDB();
      logger.info('[Agenda/Worker] Initializing agenda worker...');
      const mongoUri = getMongoUri();
      const newAgenda = new Agenda({
        db: { address: mongoUri, collection: AGENDA_COLLECTION },
        processEvery: '10 seconds',
        defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
      });

      agenda = newAgenda;
      isWorker = true;
      
      await initWebpush();
      
      defineJobs(agenda);

      const readyPromise = new Promise<Agenda>(resolve => {
        newAgenda.on('ready', async () => {
          logger.info('[Agenda/Worker] Worker connected & ready.');
          await cleanupStaleJobs(newAgenda);
          await newAgenda.start();
          logger.info('[Agenda/Worker] Worker started successfully.');
          resolve(newAgenda);
        });
      });

      newAgenda.on('error', (err: Error) => logger.error('[Agenda/Worker] Agenda error:', err));
      newAgenda.on('start', (job: Job) => logger.info(`[Agenda] Job started: ${job.attrs.name} (${job.attrs._id})`));
      newAgenda.on('success', (job: Job) => logger.info(`[Agenda] Job succeeded: ${job.attrs.name} (${job.attrs._id})`));
      newAgenda.on('fail', (err: Error, job: Job) => logger.error(`[Agenda] Job failed: ${job.attrs.name} (${job.attrs._id})`, { error: err.message }));
      newAgenda.on('complete', (job: Job) => logger.info(`[Agenda] Job completed: ${job.attrs.name} (${job.attrs._id})`));
      
      return await readyPromise;
    } catch (error) {
      logger.error('[Agenda/Worker] Failed to initialize Agenda worker:', error);
      agendaReady = null;
      agenda = null;
      throw error;
    }
  })();

  return agendaReady;
}

function defineJobs(agenda: Agenda) {
  agenda.define('send-announcement-notification', { concurrency: 5 }, async (job: Job<SendAnnouncementNotificationData>) => {
		const { title, body, icon, badge, data } = job.attrs.data;

		if (!webPushService.isInitialized()) {
			logger.warn('[Agenda/Job] WebPush service not ready, cannot send announcement.');
			return;
		}

    logger.info('[Agenda/Job] Sending announcement notification to all users.');
		await webPushService.sendNotificationToAll({ title, body, icon, badge, data });
	});

	agenda.define('sendPushEvent', { concurrency: 5 }, async (job: Job<{ eventId: string }>) => {
    const { eventId } = job.attrs.data;
    if (!eventId) {
      logger.error('[Agenda/Job] sendPushEvent job is missing eventId');
      return;
    }

    const scheduledEvent = await ScheduledPushEvent.findById(eventId).lean();
    if (!scheduledEvent || !scheduledEvent.active) {
      logger.warn(`[Agenda/Job] Scheduled push event ${eventId} not found or inactive. Removing job.`);
      await job.remove();
      return;
    }

    const payload = {
      title: scheduledEvent.title,
      body: scheduledEvent.body,
    };

    switch (scheduledEvent.type) {
      case 'general':
        await webPushService.sendNotificationToAll(payload);
        break;
      case 'user':
        if (scheduledEvent.targetUserId) {
          await webPushService.sendNotificationToUser(scheduledEvent.targetUserId, payload);
        } else {
          logger.error(`[Agenda/Job] sendPushEvent job ${scheduledEvent._id} is type 'user' but has no targetUserId.`);
        }
        break;
      case 'group':
        if (scheduledEvent.groupId) {
          await webPushService.sendNotificationsToGroup(scheduledEvent.groupId.toString(), payload);
        } else {
          logger.error(`[Agenda/Job] sendPushEvent job ${scheduledEvent._id} is type 'group' but has no groupId.`);
        }
        break;
    }

    if (scheduledEvent.repeat === 'once') {
      logger.info(`[Agenda/Job] Removing completed 'once' job for event ${eventId}.`);
      await job.remove();
    }
  });
  logger.info('[Agenda] All jobs defined');
}

/**
 * Retrieves the currently active agenda instance.
 * Throws an error if no instance (client or worker) is initialized.
 * @deprecated Use getAgendaClient() instead for scheduling.
 */
export function getAgenda(): Agenda {
	if (!agenda) {
		throw new Error('Agenda has not been initialized. Call getAgendaClient() first.');
	}
	return agenda;
}

/**
 * Gracefully shuts down the Agenda scheduler worker.
 */
export async function stopAgenda(): Promise<void> {
	if (agenda && isWorker) {
		logger.info('[Agenda/Worker] Stopping scheduler...');
		await agenda.stop();
    agenda = null;
    agendaReady = null;
    isWorker = false;
    logger.info('[Agenda/Worker] Scheduler stopped.');
	}
}

/**
 * Cleans up stale jobs that might have been left running.
 * This should be run by the worker on startup.
 */
export async function cleanupStaleJobs(agendaInstance: Agenda): Promise<void> {
	logger.info('[Agenda/Worker] Cleaning up stale or stuck jobs...');
	try {
    const numRemoved = await agendaInstance.cancel({
      lockedAt: { $exists: true, $ne: null },
      lastFinishedAt: { $exists: false }
    });
		
		if (numRemoved && numRemoved > 0) {
			logger.warn(`[Agenda/Worker] Removed ${numRemoved} stale/locked jobs.`);
		} else {
			logger.info('[Agenda/Worker] No stale jobs found.');
		}
	} catch (error) {
		logger.error('[Agenda/Worker] Error cleaning up stale jobs:', error);
	}
}
