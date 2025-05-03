import mongoose from 'mongoose';
import { logger } from '@/server/lib/logger';

// MongoDB Konfiguration aus Umgebungsvariablen
const MONGO_CONFIG = {
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT || '27017',
  database: process.env.MONGO_DATABASE || 'huegelfest',
  username: process.env.MONGO_USERNAME,
  password: process.env.MONGO_PASSWORD,
  authSource: process.env.MONGO_AUTH_SOURCE || 'huegelfest',
  authMechanism: process.env.MONGO_AUTH_MECHANISM || 'SCRAM-SHA-256'
};

// Baue MongoDB URI
const MONGODB_URI = MONGO_CONFIG.username && MONGO_CONFIG.password
  ? `mongodb://${MONGO_CONFIG.username}:${MONGO_CONFIG.password}@${MONGO_CONFIG.host}:${MONGO_CONFIG.port}/${MONGO_CONFIG.database}?authSource=${MONGO_CONFIG.authSource}&authMechanism=${MONGO_CONFIG.authMechanism}`
  : `mongodb://${MONGO_CONFIG.host}:${MONGO_CONFIG.port}/${MONGO_CONFIG.database}`;

if (!MONGODB_URI) {
  logger.error('[Database] MongoDB Konfiguration ist unvollständig');
  throw new Error('MongoDB Konfiguration ist unvollständig');
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

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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