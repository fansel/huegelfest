import mongoose from 'mongoose';
import { User } from '@/database/models/User';
import { getAuthConfig } from '@/server/config/auth';
import { logger } from '@/server/lib/logger';

// Prüfe, ob wir in der Edge Runtime sind (nur zur Laufzeit)
const isEdgeRuntime = () => {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_RUNTIME === 'edge';
  }
  return false;
};

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

// Verbinde mit der Datenbank
export async function connectDB(): Promise<void> {
  // Prüfe, ob wir in der Edge Runtime sind
  if (isEdgeRuntime()) {
    logger.warn('[Database] connectDB wurde im Edge Runtime aufgerufen. Datenbankoperationen sind in der Edge Runtime nicht möglich.');
    return Promise.resolve();
  }

  // Wenn bereits verbunden, nichts tun
  if (state.isConnected) {
    logger.debug('[MongoDB] Bereits verbunden');
    return;
  }

  // Wenn Verbindung bereits im Gange, warte auf diese
  if (state.isConnecting && state.connectionPromise) {
    logger.debug('[MongoDB] Verbindung bereits im Gange, warte...');
    return state.connectionPromise;
  }

  // Starte neue Verbindung
  state.isConnecting = true;
  state.connectionPromise = (async () => {
    try {
      const uri = getMongoUri();
      await mongoose.connect(uri, MONGODB_OPTIONS);
      
      // Event Listener für Verbindungsstatus
      mongoose.connection.on('error', (error) => {
        logger.error('[MongoDB] Verbindungsfehler:', error);
        state.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('[MongoDB] Verbindung getrennt');
        state.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('[MongoDB] Verbindung wiederhergestellt');
        state.isConnected = true;
      });

      state.isConnected = true;
      logger.info('[MongoDB] Verbindung hergestellt');

      // Initialisiere die Datenbank
      await initializeDatabase();
    } catch (error) {
      logger.error('[MongoDB] Verbindungsfehler:', error);
      state.isConnected = false;
      throw error;
    } finally {
      state.isConnecting = false;
      state.connectionPromise = null;
    }
  })();

  return state.connectionPromise;
}

// Trenne die Datenbankverbindung
export async function disconnectDB(): Promise<void> {
  // Prüfe, ob wir in der Edge Runtime sind
  if (isEdgeRuntime()) {
    logger.warn('[Database] disconnectDB wurde im Edge Runtime aufgerufen. Datenbankoperationen sind in der Edge Runtime nicht möglich.');
    return Promise.resolve();
  }

  if (!state.isConnected) {
    logger.debug('[MongoDB] Nicht verbunden');
    return;
  }

  try {
    await mongoose.disconnect();
    state.isConnected = false;
    logger.info('[Database] MongoDB Verbindung geschlossen');
  } catch (error) {
    logger.error('[MongoDB] Fehler beim Trennen der Verbindung:', error);
    throw error;
  }
} 