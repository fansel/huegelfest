// Prüfe, ob wir in der Edge Runtime sind
const isEdgeRuntime = () => {
  return typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
};

// Edge-kompatibler Logger
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isEdgeRuntime()) {
      console.log(`[INFO] ${message}`, ...args);
    } else {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isEdgeRuntime()) {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isEdgeRuntime()) {
      console.error(`[ERROR] ${message}`, ...args);
    } else {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (isEdgeRuntime()) {
      console.debug(`[DEBUG] ${message}`, ...args);
    } else {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};
