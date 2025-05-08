import { logger } from './logger';
import { webPushService } from '@/lib/webpush/webPushService';
import Group from '@/lib/db/models/Group';

let isInitialized = false;

export async function initializeServices() {
  if (isInitialized) {
    logger.debug('[Init] Services bereits initialisiert');
    return;
  }

  logger.info('[Init] Starte Initialisierung der Services...');

  try {
    // WebPush Service initialisieren
    logger.info('[Init] Initialisiere WebPush Service...');
    webPushService.initialize();
    if (webPushService.isInitialized()) {
      logger.info('[Init] WebPush Service erfolgreich initialisiert');
    } else {
      logger.warn('[Init] WebPush Service konnte nicht initialisiert werden');
    }

    // Default-Gruppe prüfen/erstellen
    logger.info('[Init] Prüfe auf Default-Gruppe...');
    const defaultGroup = await Group.findOne({ name: 'default' });
    if (!defaultGroup) {
      await Group.create({ name: 'default', color: '#FFF000' });
      logger.info('[Init] Default-Gruppe wurde erstellt.');
    } else {
      logger.info('[Init] Default-Gruppe existiert bereits.');
    }

    // Hier können weitere Services initialisiert werden
    // ...

    isInitialized = true;
    logger.info('[Init] Alle Services erfolgreich initialisiert');
  } catch (error) {
    logger.error('[Init] Fehler bei der Service-Initialisierung:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export function isServicesInitialized() {
  return isInitialized;
} 