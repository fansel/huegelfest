import { initializeModels } from '@/database/models';
import { initializeAdmin } from '@/auth/auth';
import { initializeDefaultCategories } from './defaultCategories';
import { logger } from '@/server/lib/logger';

export async function initializeDatabase() {
  try {
    logger.info('[DB] Starte Datenbank-Initialisierung');
    
    // Initialisiere Mongoose-Modelle
    await initializeModels();
    logger.info('[DB] Modelle initialisiert');
    
    // Initialisiere Admin-Benutzer
    await initializeAdmin();
    logger.info('[DB] Admin-Benutzer initialisiert');
    
    // Initialisiere Default-Kategorien
    await initializeDefaultCategories();
    logger.info('[DB] Default-Kategorien initialisiert');
    
    logger.info('[DB] Datenbank-Initialisierung erfolgreich abgeschlossen');
  } catch (error) {
    logger.error('[DB] Fehler bei der Datenbank-Initialisierung:', error);
    throw error;
  }
}

export { initializeDefaultCategories }; 