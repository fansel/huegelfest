import { connectDB } from './db/connector';
import { logger } from './logger';
import { ensureDefaultCategories, ensureDefaultWorkingGroup, ensureDefaultGroups } from './db/initDefaults';
import { initWebpush } from './initWebpush';
import { webPushService } from './webpush/webPushService';
import { initDefaultFestivalDaysIfEmpty } from '@/shared/services/festivalDaysService';

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
  
  // Datenbank-Initialisierung (nicht-kritisch für lokale Entwicklung)
  try {
    await connectDB();
    status.db = true;
    logger.info('[Init] Datenbank erfolgreich initialisiert.');
    
    // Nur wenn DB-Verbindung erfolgreich ist, Default-Daten sicherstellen
    try {
      await ensureDefaultWorkingGroup();
      logger.info('[Init] Default-Gruppe sichergestellt.');
      await ensureDefaultGroups();
      logger.info('[Init] Default-Benutzergruppen sichergestellt.');
      await ensureDefaultCategories();
      logger.info('[Init] Default-Kategorien sichergestellt.');
    } catch (err) {
      logger.warn('[Init] Fehler bei Default-Daten (nicht kritisch):', err);
    }
  } catch (err) {
    status.errors.push('DB: ' + (err instanceof Error ? err.message : String(err)));
    logger.warn('[Init] Datenbank nicht verfügbar (ok für lokale Entwicklung):', err);
  }
  
  // WebPush-Initialisierung (nicht-kritisch)
  try {
    await initWebpush();
    status.webPush = webPushService.isInitialized();
    if (status.webPush) {
      logger.info('[Init] WebPush erfolgreich initialisiert.');
    } else {
      status.errors.push('WebPush: Initialisierung fehlgeschlagen');
      logger.warn('[Init] WebPush konnte nicht initialisiert werden (nicht kritisch).');
    }
  } catch (err) {
    status.errors.push('WebPush: ' + (err instanceof Error ? err.message : String(err)));
    logger.warn('[Init] Fehler bei der WebPush-Initialisierung (nicht kritisch):', err);
  }
  
  // Initialize default festival days if none exist
  try {
    await initDefaultFestivalDaysIfEmpty();
  } catch (err) {
    status.errors.push('Festival Days: ' + (err instanceof Error ? err.message : String(err)));
    logger.warn('[Init] Fehler bei der Initialisierung der Festival-Tage (nicht kritisch):', err);
  }
  
  initialized = true;
  
  // Nur in Produktion sind diese Fehler kritisch
  const isProduction = process.env.NODE_ENV === 'production';
  if (status.errors.length > 0 && isProduction) {
    logger.error('[Init] Kritische Initialisierungsfehler in Produktion:', status.errors);
    throw new Error('Kritische Initialisierungsfehler: ' + status.errors.join('; '));
  } else if (status.errors.length > 0) {
    logger.warn('[Init] Service-Initialisierungsfehler (nicht kritisch in Entwicklung):', status.errors);
  }
  
  logger.info('[Init] Service-Initialisierung abgeschlossen.');
  return status;
}

/**
 * Gibt den aktuellen Initialisierungsstatus zurück.
 */
export function getInitStatus(): InitStatus {
  return status;
} 