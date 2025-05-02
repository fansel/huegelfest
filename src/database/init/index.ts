import { initializeDefaultCategories } from './dbInit';
import { logger } from '@/server/lib/logger';

export async function initializeDatabase() {
  try {
    logger.info('[DB Init] Starte Datenbank-Initialisierung');
    await initializeDefaultCategories();
    logger.info('[DB Init] Datenbank-Initialisierung abgeschlossen');
  } catch (error) {
    logger.error('[DB Init] Fehler bei der Datenbank-Initialisierung:', error);
    throw error;
  }
} 