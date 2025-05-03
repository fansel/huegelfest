import { MongoClient, Db } from 'mongodb';
import { logger } from '../init/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/huegelfest';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    logger.info('MongoDB verbunden');
    return { client, db };
  } catch (error) {
    logger.error('Fehler bei der MongoDB Verbindung:', error);
    throw new Error('Fehler bei der MongoDB Verbindung');
  }
} 