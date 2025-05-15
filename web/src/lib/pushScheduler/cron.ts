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
  function isActiveToday(pool: any, today: Date): boolean {
    const start = new Date(pool.startDate + 'T00:00:00Z');
    const end = new Date(pool.endDate + 'T23:59:59Z');
    if (today < start || today > end) return false;
    if (pool.repeat === 'once') {
      return today.toISOString().slice(0, 10) === pool.startDate;
    }
    if (pool.repeat === 'daily') {
      return true;
    }
    if (pool.repeat === 'custom' && Array.isArray(pool.weekdays)) {
      return pool.weekdays.includes(today.getDay());
    }
    return false;
  }

  async function sendAllScheduledPushes() {
    console.log(`[PushScheduler] Starte Prüfung um ${new Date().toISOString()}`);
    await connectDB();
    await webPushService.initialize();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const today = new Date(todayStr + 'T00:00:00Z');

    // FunPushPools
    const pools = await getFunPushPools();
    if (!pools.length) console.log('[PushScheduler] Keine FunPushPools gefunden.');
    for (const pool of pools) {
      if (!isActiveToday(pool, today)) continue;
      // Ziehe Zufallsminuten für heute
      const randomTimes = getRandomMinutesForDay(pool.id, todayStr, pool.from, pool.to, pool.count);
      for (const randomTime of randomTimes) {
        const [h, m] = randomTime.split(':');
        for (let delta = 0; delta <= 119; delta++) {
          const check = new Date(now.getTime() - delta * 60000);
          if (check.getHours() === Number(h) && check.getMinutes() === Number(m) && check.toISOString().slice(0, 10) === todayStr) {
            const msg = pool.messages[Math.floor(Math.random() * pool.messages.length)];
            const alreadySent = await wasSent(pool.id, todayStr, randomTime, msg.id);
            if (!alreadySent) {
              try {
                console.log(`[PushScheduler] Sende FunPool-Push: ${msg.text} (${randomTime})`);
                await webPushService.sendNotificationToAll({
                  title: 'Fun Push',
                  body: msg.text,
                });
                await logSent(pool.id, todayStr, randomTime, msg.id);
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
        const [h, m] = send.time.split(':');
        // Prüfe die letzten 120 Minuten (robust gegen längere Aussetzer)
        for (let delta = 0; delta <= 119; delta++) {
          const check = new Date(now.getTime() - delta * 60000);
          if (
            now.getFullYear() === check.getFullYear() &&
            now.getMonth() === check.getMonth() &&
            now.getDate() === check.getDate() &&
            now.getHours() === check.getHours() &&
            now.getMinutes() === check.getMinutes()
          ) {
            const dateStr = check.toISOString().slice(0, 10);
            const timeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
            const alreadySent = await wasSentScheduled(msg.id, dateStr, timeStr, msg.id);
            if (!alreadySent) {
              try {
                console.log(`[PushScheduler] Sende Scheduled-Push: ${msg.text}`);
                await webPushService.sendNotificationToAll({
                  title: 'Geplante Push-Nachricht',
                  body: msg.text,
                });
                await logSentScheduled(msg.id, dateStr, timeStr, msg.id);
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
    console.log(`[PushScheduler] Prüfung abgeschlossen um ${new Date().toISOString()}`);
  }

  // Starte node-cron: jede Minute
  cron.schedule('* * * * *', async () => {
    console.log('[PushScheduler] Cron-Job getriggert.');
    try {
      await sendAllScheduledPushes();
    } catch (e) {
      console.error('[PushScheduler] Fehler:', e);
    }
  });

  console.log('[PushScheduler] Cron-Job läuft (jede Minute)...');
})();

export {}; 