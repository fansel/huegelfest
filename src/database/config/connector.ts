import mongoose from 'mongoose';
import { logger } from '@/server/lib/logger';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error('[Database] MONGODB_URI ist nicht definiert');
  throw new Error('MONGODB_URI ist nicht definiert');
}

logger.info('[Database] Versuche Verbindung zu MongoDB herzustellen...');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    logger.info('[Database] Verwende existierende Verbindung');
    return cached.conn;
  }

  if (!cached.promise) {
    logger.info('[Database] Erstelle neue Verbindung');
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      logger.info('[Database] MongoDB erfolgreich verbunden');
      return mongoose;
    }).catch((error) => {
      logger.error('[Database] MongoDB Verbindungsfehler:', error);
      throw error;
    });
  }

  try {
    logger.info('[Database] Warte auf Verbindungsversprechen...');
    cached.conn = await cached.promise;
    logger.info('[Database] Verbindung erfolgreich hergestellt');
  } catch (e) {
    logger.error('[Database] Fehler beim Herstellen der Verbindung:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB Verbindung geschlossen');
  }
} 