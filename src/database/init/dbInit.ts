import { connectDB } from '../config/connector';
import Category from '../models/Category';
import { defaultCategories } from './defaultCategories';
import { logger } from '@/server/lib/logger';

export async function initializeDefaultCategories() {
  try {
    // Stelle sicher, dass die Verbindung hergestellt ist
    await connectDB();
    
    const existingCategories = await Category.find();
    if (existingCategories.length === 0) {
      logger.info('[DB Init] Initialisiere Default-Kategorien');
      await Category.insertMany(defaultCategories);
      logger.info('[DB Init] Default-Kategorien erfolgreich initialisiert');
    }
  } catch (error) {
    logger.error('[DB Init] Fehler beim Initialisieren der Default-Kategorien:', error);
    throw error;
  }
} 