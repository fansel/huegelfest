import { logger } from './logger';
import { webPushService } from './webpush';

export async function initializeServices() {
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

    // Hier können weitere Services initialisiert werden
    // ...

    logger.info('[Init] Alle Services erfolgreich initialisiert');
  } catch (error) {
    logger.error('[Init] Fehler bei der Service-Initialisierung:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
} 