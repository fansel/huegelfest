// Prüfe, ob wir in der Edge Runtime sind
const isEdgeRuntime = () => {
  return typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
};

// Edge-kompatibler Logger
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};
