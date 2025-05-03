import mongoose from 'mongoose';
import { connectDB } from '../config/connector';
import { logger } from '@/server/lib/logger';
import { Category } from './Category';
import { User } from './User';
import { Timeline } from './Timeline';

let isInitialized = false;

export async function initializeModels() {
  if (isInitialized) {
    return;
  }

  try {
    await connectDB();
    isInitialized = true;
    logger.info('[Models] Modelle erfolgreich initialisiert');
  } catch (error) {
    logger.error('[Models] Fehler bei der Model-Initialisierung:', error);
    throw error;
  }
}

// Exportiere die Modelle
export { Category, User, Timeline }; 