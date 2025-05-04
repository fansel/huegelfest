import mongoose from 'mongoose';
import { logger } from '@/server/lib/logger';

// MongoDB Konfiguration wird zur Runtime geladen
function getMongoConfig() {
  return {
    host: process.env.MONGO_HOST || 'localhost',
    port: process.env.MONGO_PORT || '27017',
    database: process.env.MONGO_DATABASE || 'huegelfest'
  };
}

// Baue MongoDB URI zur Runtime
function getMongoUri() {
  const config = getMongoConfig();
  return `mongodb://${config.host}:${config.port}/${config.database}`;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    const mongoConfig = {
      host: process.env.MONGO_HOST || 'localhost',
      port: process.env.MONGO_PORT || '27017',
      database: process.env.MONGO_DATABASE || 'huegelfest'
    };

    const uri = `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}`;
    
    if (mongoose.connection.readyState === 1) {
      logger.debug('[MongoDB] Bereits verbunden');
      return;
    }

    await mongoose.connect(uri);
    logger.info('[MongoDB] Verbindung erfolgreich hergestellt');
  } catch (error) {
    logger.error('[MongoDB] Verbindungsfehler:', error);
    throw error;
  }
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.info('[Database] MongoDB Verbindung geschlossen');
  }
} 