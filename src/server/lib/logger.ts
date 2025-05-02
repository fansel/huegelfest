
import path from 'path';

const isServer = typeof window === 'undefined';

// Erstelle das logs Verzeichnis, falls es nicht existiert
const logDir = path.join(process.cwd(), 'logs');
if (isServer && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

type LogArgs = unknown[];

const logger = {
  info: (message: string, ...args: LogArgs) => {
    if (isServer) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: LogArgs) => {
    if (isServer) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: LogArgs) => {
    if (isServer) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: LogArgs) => {
    if (isServer) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
};

export { logger };
