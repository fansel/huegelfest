const isServer = typeof window === 'undefined';

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