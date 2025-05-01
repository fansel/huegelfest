import mongoose from 'mongoose';
import { logger } from './logger';
import { connectDB } from '../config/connector';

export async function resetDatabase() {
  try {
    await connectDB();
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.drop();
    }

    logger.info('Datenbank erfolgreich zurückgesetzt');
    return { success: true, message: 'Datenbank erfolgreich zurückgesetzt' };
  } catch (error) {
    logger.error('Fehler beim Zurücksetzen der Datenbank:', error);
    throw new Error('Fehler beim Zurücksetzen der Datenbank');
  }
} 