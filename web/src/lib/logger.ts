// Prüfe, ob wir in der Edge Runtime sind
const isEdgeRuntime = () => {
  return typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
};

// Fallback-Logger für Node.js/Edge/sonstige Umgebungen
function fallbackLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]) {
  const prefix = `[${level.toUpperCase()}]`;
  try {
    if (typeof window === 'undefined') {
      // Node.js oder Edge: Immer auf Konsole schreiben
      switch (level) {
        case 'info':
          console.log(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'error':
          console.error(prefix, message, ...args);
          break;
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
      }
    } else {
      // Browser: Optional, hier könnten wir z.B. in localStorage loggen
      // (oder einfach nichts tun)
    }
  } catch (e) {
    // Fallback: Immer auf Konsole schreiben, falls irgendwas schiefgeht
    console.log(prefix, message, ...args);
  }
}

export const logger = {
  info: (message: string, ...args: any[]) => fallbackLog('info', message, ...args),
  warn: (message: string, ...args: any[]) => fallbackLog('warn', message, ...args),
  error: (message: string, ...args: any[]) => fallbackLog('error', message, ...args),
  debug: (message: string, ...args: any[]) => fallbackLog('debug', message, ...args)
};
