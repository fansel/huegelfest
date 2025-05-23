import Agenda, { Job } from 'agenda';
import { connectDB } from '../db/connector';
import { logger } from '../logger';
import { webPushService } from '../webpush/webPushService';
import ScheduledPushEvent from '../db/models/ScheduledPushEvent';
import { Subscriber } from '../db/models/Subscriber';
import { initWebpush } from '../initWebpush';
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
  defaultLockLifetime: 600000
});

agenda.define<SendPushEventData>('sendPushEvent', { lockLifetime: 300000, concurrency: 5 }, async (job: Job) => {
  const { eventId } = job.attrs.data;
  logger.info(`[Agenda] Executing sendPushEvent for event: ${eventId}`);
  try {
    const event = await ScheduledPushEvent.findById(eventId);
    if (!event?.active) {
      logger.warn(`[Agenda] Event invalid or inactive: ${eventId}`);
      return;
    }
    const subs = event.sendToAll
      ? await Subscriber.find()
      : await Subscriber.find({ _id: { $in: event.subscribers } });
    for (const sub of subs) {
      if (!sub.endpoint) continue;
      await initWebpush();
      if (webPushService.isInitialized()) {
        await webPushService.sendNotification(sub, { title: event.title, body: event.body });
        logger.info(`[Agenda] Notification sent to subscriber ${sub.id}`);
      }
    }
  } catch (err) {
    logger.error(`[Agenda] Error in sendPushEvent job for ${eventId}:`, err);
  }
});

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
  logger.info('[Agenda] Polling for jobs...');
  const totalJobs = await agenda.jobs({ name: 'sendPushEvent' });
  logger.info(`[Agenda] Total 'sendPushEvent' jobs: ${totalJobs.length}`);
  const openJobs = await agenda.jobs({ name: 'sendPushEvent', nextRunAt: { $ne: null } });
  logger.info(`[Agenda] Open 'sendPushEvent' jobs: ${openJobs.length}`);
}, 30000);

export default agenda;
