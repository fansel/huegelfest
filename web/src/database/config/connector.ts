import mongoose from 'mongoose';
import { logger } from '@/server/lib/logger';

// MongoDB Konfiguration wird zur Runtime geladen
function getMongoConfig() {
  return {
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || '27017',
    database: process.env.MONGO_DATABASE || 'huegelfest',
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    authSource: process.env.MONGO_AUTH_SOURCE || 'huegelfest',
    authMechanism: process.env.MONGO_AUTH_MECHANISM || 'SCRAM-SHA-256'
  };
}

// Baue MongoDB URI zur Runtime
function getMongoUri() {
  const config = getMongoConfig();
  return config.username && config.password
    ? `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=${config.authSource}&authMechanism=${config.authMechanism}`
    : `mongodb://${config.host}:${config.port}/${config.database}`;
}

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
    const MONGODB_URI = getMongoUri();
    
    if (!MONGODB_URI) {
      logger.error('[Database] MongoDB Konfiguration ist unvollständig');
      throw new Error('MongoDB Konfiguration ist unvollständig');
    }

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