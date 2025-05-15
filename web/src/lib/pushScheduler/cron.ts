import { DateTime } from 'luxon';

(async () => {
  const cron = (await import('node-cron')).default || (await import('node-cron'));
  const { connectDB } = await import('../../lib/db/connector.js');
  const { getFunPushPools } = await import('../../features/admin/components/pushScheduler/services/funPushPoolService.js');
  const { getScheduledPushMessages } = await import('../../features/admin/components/pushScheduler/services/scheduledPushService.js');
  const { webPushService } = await import('../../lib/webpush/webPushService.js');
  const { wasSent, logSent } = await import('../../features/admin/components/pushScheduler/services/funPushPoolSentLogService.js');
  const { wasSent: wasSentScheduled, logSent: logSentScheduled } = await import('../../features/admin/components/pushScheduler/services/scheduledPushSentLogService.js');

  console.log('[PushScheduler] Modul geladen. Scheduler wird initialisiert ...');

  // Hilfsfunktion: Erzeuge deterministisch die Minuten für das Zeitfenster
  function getRandomMinutesForDay(poolId: string, date: string, from: string, to: string, count: number): string[] {
    // from/to: "HH:mm"
    const [fromH, fromM] = from.split(':').map(Number);
    const [toH, toM] = to.split(':').map(Number);
    const start = fromH * 60 + fromM;
    const end = toH * 60 + toM;
    const minutes = [];
    for (let m = start; m <= end; m++) minutes.push(m);
    // Deterministisch: Seed aus PoolId+date+from+to
    const seed = poolId + date + from + to;
    function seededRandom(i: number) {
      let h = 2166136261 >>> 0;
      for (let c of (seed + i)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
      return (h >>> 0) / 2 ** 32;
    }
    const shuffled = [...minutes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(m => {
      const h = Math.floor(m / 60).toString().padStart(2, '0');
      const min = (m % 60).toString().padStart(2, '0');
      return `${h}:${min}`;
    });
  }

  // Hilfsfunktion: Prüfe, ob ein Pool heute aktiv ist
  function isActiveToday(pool: any, today: DateTime): boolean {
    const start = DateTime.fromISO(pool.startDate, { zone: 'Europe/Berlin' }).startOf('day');
    const end = DateTime.fromISO(pool.endDate, { zone: 'Europe/Berlin' }).endOf('day');
    if (today < start || today > end) return false;
    if (pool.repeat === 'once') {
      return today.toISODate() === pool.startDate;
    }
    if (pool.repeat === 'daily') {
      return true;
    }
    if (pool.repeat === 'custom' && Array.isArray(pool.weekdays)) {
      return pool.weekdays.includes(today.weekday % 7); // Luxon: 1=Mo, 7=So
    }
    return false;
  }

  async function sendAllScheduledPushes() {
    const now = DateTime.now().setZone('Europe/Berlin');
    const todayStr = now.toISODate(); // YYYY-MM-DD
    const today = now.startOf('day');
    console.log(`[PushScheduler] Starte Prüfung um ${now.toISO()}`);
    await connectDB();
    await webPushService.initialize();

    // FunPushPools
    const pools = await getFunPushPools();
    if (!pools.length) console.log('[PushScheduler] Keine FunPushPools gefunden.');
    for (const pool of pools) {
      if (!isActiveToday(pool, today)) continue;
      // Ziehe Zufallsminuten für heute
      const randomTimes = getRandomMinutesForDay(
        pool.id ?? '',
        todayStr ?? '',
        pool.from ?? '',
        pool.to ?? '',
        pool.count ?? 0
      );
      for (const randomTime of randomTimes) {
        const [h, m] = (randomTime ?? '').split(':');
        for (let delta = 0; delta <= 119; delta++) {
          const check = now.minus({ minutes: delta });
          if (
            check.hour === Number(h) &&
            check.minute === Number(m) &&
            check.toISODate() === todayStr
          ) {
            const msg = pool.messages[Math.floor(Math.random() * pool.messages.length)];
            const alreadySent = await wasSent(pool.id ?? '', todayStr ?? '', randomTime ?? '', msg.id ?? '');
            if (!alreadySent) {
              try {
                console.log(`[PushScheduler] Sende FunPool-Push: ${msg.text} (${randomTime})`);
                await webPushService.sendNotificationToAll({
                  title: 'Fun Push',
                  body: msg.text,
                });
                await logSent(pool.id ?? '', todayStr ?? '', randomTime ?? '', msg.id ?? '');
                console.log(`[PushScheduler] FunPool-Push gesendet: ${msg.text}`);
              } catch (err) {
                console.error('[PushScheduler] Fehler beim Senden FunPool:', err);
              }
            }
          }
        }
      }
    }

    // ScheduledPushMessages
    const singles = await getScheduledPushMessages();
    if (!singles.length) console.log('[PushScheduler] Keine ScheduledPushMessages gefunden.');
    for (const msg of singles) {
      for (const send of msg.sendTimes) {
        const [h, m] = (send.time ?? '').split(':');
        for (let delta = 0; delta <= 119; delta++) {
          const check = now.minus({ minutes: delta });
          if (
            now.year === check.year &&
            now.month === check.month &&
            now.day === check.day &&
            check.hour === Number(h) &&
            check.minute === Number(m)
          ) {
            const dateStr = check.toISODate() ?? '';
            const timeStr = `${(h ?? '').padStart(2, '0')}:${(m ?? '').padStart(2, '0')}`;
            const alreadySent = await wasSentScheduled(msg.id ?? '', dateStr, timeStr, msg.id ?? '');
            if (!alreadySent) {
              try {
                console.log(`[PushScheduler] Sende Scheduled-Push: ${msg.text}`);
                await webPushService.sendNotificationToAll({
                  title: 'Geplante Push-Nachricht',
                  body: msg.text,
                });
                await logSentScheduled(msg.id ?? '', dateStr, timeStr, msg.id ?? '');
                console.log(`[PushScheduler] Scheduled-Push gesendet: ${msg.text}`);
              } catch (err) {
                console.error('[PushScheduler] Fehler beim Senden Scheduled:', err);
              }
            }
          }
        }
      }
      // TODO: Wiederholungen (repeat) prüfen
    }
    console.log(`[PushScheduler] Prüfung abgeschlossen um ${now.toISO()}`);
  }

  // Starte node-cron: jede Minute
  cron.schedule('* * * * *', async () => {
    console.log('[PushScheduler] Cron-Job getriggert.');
    try {
      await sendAllScheduledPushes();
    } catch (e) {
      console.error('[PushScheduler] Fehler:', e);
    }
  }, { timezone: 'Europe/Berlin' });

  console.log('[PushScheduler] Cron-Job läuft (jede Minute)...');
})();

export {}; 