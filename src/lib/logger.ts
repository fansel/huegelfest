import winston from 'winston';
import path from 'path';
import fs from 'fs';

const isServer = typeof window === 'undefined';

// Erstelle das logs Verzeichnis, falls es nicht existiert
const logDir = path.join(process.cwd(), 'logs');
if (isServer && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isServer) {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isServer) {
      console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (isServer) {
      console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
    }
  }
}; 