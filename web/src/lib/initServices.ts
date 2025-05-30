import { connectDB } from './db/connector';
import { logger } from './logger';
import { ensureDefaultCategories, ensureDefaultWorkingGroup, ensureDefaultGroups } from './db/initDefaults';
import { initWebpush } from './initWebpush';
import { webPushService } from './webpush/webPushService';

export interface InitStatus {
  db: boolean;
  webPush: boolean;
  errors: string[];
}

let status: InitStatus = {
  db: false,
  webPush: false,
  errors: [],
};

let initialized = false;

/**
 * Initialisiert alle kritischen Services zentral.
 * Wird beim ersten Import ausgeführt.
 */
export async function initServices(): Promise<InitStatus> {
  if (initialized) return status;
  status.errors = [];
  logger.info('[Init] Initialisiere Services...');
  try {
    await connectDB();
    status.db = true;
    logger.info('[Init] Datenbank erfolgreich initialisiert.');
    await ensureDefaultWorkingGroup();
    logger.info('[Init] Default-Gruppe sichergestellt.');
    await ensureDefaultGroups();
    logger.info('[Init] Default-Benutzergruppen sichergestellt.');
    await ensureDefaultCategories();
    logger.info('[Init] Default-Kategorien sichergestellt.');
  } catch (err) {
    status.errors.push('DB: ' + (err instanceof Error ? err.message : String(err)));
    logger.error('[Init] Fehler bei der DB-Initialisierung:', err);
  }
  try {
    await initWebpush();
    status.webPush = webPushService.isInitialized();
    if (status.webPush) {
      logger.info('[Init] WebPush erfolgreich initialisiert.');
    } else {
      status.errors.push('WebPush: Initialisierung fehlgeschlagen');
      logger.error('[Init] WebPush konnte nicht initialisiert werden.');
    }
  } catch (err) {
    status.errors.push('WebPush: ' + (err instanceof Error ? err.message : String(err)));
    logger.error('[Init] Fehler bei der WebPush-Initialisierung:', err);
  }
  initialized = true;
  if (status.errors.length > 0) {
    logger.error('[Init] Kritische Initialisierungsfehler:', status.errors);
    throw new Error('Kritische Initialisierungsfehler: ' + status.errors.join('; '));
  }
  logger.info('[Init] Alle Services initialisiert.');
  return status;
}

/**
 * Gibt den aktuellen Initialisierungsstatus zurück.
 */
export function getInitStatus(): InitStatus {
  return status;
} 