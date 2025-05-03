const logger = {
  info: (...args: unknown[]) => {
    if (typeof window === 'undefined') {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (typeof window === 'undefined') {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (typeof window === 'undefined') {
      console.warn('[WARN]', ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (typeof window === 'undefined') {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export { logger };
