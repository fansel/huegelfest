import mongoose from 'mongoose';
import { User } from './models/User';
// Passe ggf. logger-Import an, z.B. aus web/src/lib/logger

declare const window: Window & typeof globalThis | undefined;

const isEdgeRuntime = () => {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return process.env.NEXT_RUNTIME === 'edge';
  }
  return false;
};

const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

const getMongoConfig = () => ({
  host: process.env.MONGO_HOST || 'localhost',
  port: process.env.MONGO_PORT || '27017',
  database: process.env.MONGO_DATABASE || 'huegelfest'
});

const getMongoUri = () => {
  const config = getMongoConfig();
  return `mongodb://${config.host}:${config.port}/${config.database}`;
};

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

async function initializeDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // logger.info('[Auth] Datenbank ist leer, erstelle Admin-Benutzer');
      // Passe ggf. getAuthConfig-Import an
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
      await User.create({
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });
      // logger.info('[Auth] Admin-Benutzer erfolgreich erstellt');
    }
  } catch (error) {
    // logger.error('[Database] Fehler bei der Initialisierung:', error);
    throw error;
  }
}

export async function connectDB(): Promise<void> {
  if (isEdgeRuntime()) {
    // logger.warn('[Database] connectDB wurde im Edge Runtime aufgerufen. Datenbankoperationen sind in der Edge Runtime nicht möglich.');
    return Promise.resolve();
  }
  if (state.isConnected) {
    // logger.debug('[MongoDB] Bereits verbunden');
    return;
  }
  if (state.isConnecting && state.connectionPromise) {
    // logger.debug('[MongoDB] Verbindung bereits im Gange, warte...');
    return state.connectionPromise;
  }
  state.isConnecting = true;
  state.connectionPromise = (async () => {
    try {
      const uri = getMongoUri();
      await mongoose.connect(uri, MONGODB_OPTIONS);
      mongoose.connection.on('error', (error) => {
        // logger.error('[MongoDB] Verbindungsfehler:', error);
        state.isConnected = false;
      });
      mongoose.connection.on('disconnected', () => {
        // logger.warn('[MongoDB] Verbindung getrennt');
        state.isConnected = false;
      });
      mongoose.connection.on('reconnected', () => {
        // logger.info('[MongoDB] Verbindung wiederhergestellt');
        state.isConnected = true;
      });
      state.isConnected = true;
      // logger.info('[MongoDB] Verbindung hergestellt');
      await initializeDatabase();
    } catch (error) {
      // logger.error('[MongoDB] Verbindungsfehler:', error);
      state.isConnected = false;
      throw error;
    } finally {
      state.isConnecting = false;
      state.connectionPromise = null;
    }
  })();
  return state.connectionPromise;
}

export async function disconnectDB(): Promise<void> {
  if (isEdgeRuntime()) {
    // logger.warn('[Database] disconnectDB wurde im Edge Runtime aufgerufen. Datenbankoperationen sind in der Edge Runtime nicht möglich.');
    return Promise.resolve();
  }
  if (!state.isConnected) {
    // logger.debug('[MongoDB] Nicht verbunden');
    return;
  }
  try {
    await mongoose.disconnect();
    state.isConnected = false;
    // logger.info('[Database] MongoDB Verbindung geschlossen');
  } catch (error) {
    // logger.error('[MongoDB] Fehler beim Trennen der Verbindung:', error);
    throw error;
  }
} 