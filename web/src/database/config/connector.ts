import mongoose from 'mongoose';
import { User } from '@/database/models/User';
import { getAuthConfig } from '@/server/config/auth';
import { logger } from '@/server/lib/logger';

// MongoDB Verbindungsoptionen
const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

// MongoDB Konfiguration
const getMongoConfig = () => ({
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT || '27017',
  database: process.env.MONGO_DATABASE || 'huegelfest'
});

// Baue MongoDB URI
const getMongoUri = () => {
  const config = getMongoConfig();
  return `mongodb://${config.host}:${config.port}/${config.database}`;
};

// Connection State Management
interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionPromise: Promise<void> | null;
}

const state: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionPromise: null
};

// Initialisiere die Datenbank
async function initializeDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('[Auth] Datenbank ist leer, erstelle Admin-Benutzer');
      const { adminUsername, adminPassword } = getAuthConfig();
      await User.create({
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });
      logger.info('[Auth] Admin-Benutzer erfolgreich erstellt');
    }
  } catch (error) {
    logger.error('[Database] Fehler bei der Initialisierung:', error);
    throw error;
  }
}

// Diese Funktionen sind nur für API-Routen gedacht
export async function connectDB(): Promise<void> {
  logger.warn('[Database] connectDB wurde im Edge Runtime aufgerufen. Verwende stattdessen Server Actions.');
  return Promise.resolve();
}

export async function disconnectDB(): Promise<void> {
  logger.warn('[Database] disconnectDB wurde im Edge Runtime aufgerufen. Verwende stattdessen Server Actions.');
  return Promise.resolve();
} 