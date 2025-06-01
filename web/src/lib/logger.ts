declare const window: Window & typeof globalThis | undefined;
// Prüfe, ob wir in der Edge Runtime sind
const isEdgeRuntime = () => {
  return typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
};

let addLogEntry: ((level: string, source: string, message: string, metadata?: any) => Promise<any>) | null = null;

// Lazy import to avoid circular dependencies
async function getLogStorage() {
  if (!addLogEntry) {
    try {
      // Use relative import to avoid @/ alias issues in build
      const logModule = await import('./actions/systemDiagnostics');
      addLogEntry = logModule.addLogEntry;
    } catch (error) {
      console.warn('[Logger] Could not import log storage:', error);
    }
  }
  return addLogEntry;
}

function getLogLevel(): string {
  if (typeof window !== 'undefined') {
    return 'info'; // Client-side default
  }
  return process.env.LOG_LEVEL || 'info';
}

function shouldLog(level: string): boolean {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = getLogLevel();
  return levels[level as keyof typeof levels] >= levels[currentLevel as keyof typeof levels];
}

function getLogSource(): string {
  // Try to determine the source from the stack trace
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split('\n');
    // Look for the first line that's not from this file
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (line && !line.includes('logger.ts') && !line.includes('console.')) {
        // Extract function/file name
        const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?)(?:\)|$)/);
        if (match) {
          const functionName = match[1] || 'anonymous';
          const fileName = match[2]?.split('/').pop()?.split(':')[0] || 'unknown';
          return functionName.includes(fileName) ? functionName : `${functionName}@${fileName}`;
        }
      }
    }
  }
  return 'unknown';
}

function fallbackLog(level: string, message: string, ...args: any[]) {
  if (!shouldLog(level)) return;

  const source = getLogSource();
  const timestamp = new Date().toISOString();
  const logMessage = args.length > 0 ? `${message} ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ')}` : message;

  // Console output with colors (server-side)
  if (typeof window === 'undefined') {
    const colors = {
      debug: '\x1b[90m', // gray
      info: '\x1b[34m',  // blue
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    };
    
    const color = colors[level as keyof typeof colors] || colors.reset;
    const consoleMethod = console[level as 'info' | 'warn' | 'error' | 'debug'];
    if (typeof consoleMethod === 'function') {
      consoleMethod(`${color}[${timestamp}] [${level.toUpperCase()}] [${source}] ${logMessage}${colors.reset}`);
    }
  } else {
    // Browser console
    const consoleMethod = console[level as 'info' | 'warn' | 'error' | 'debug'];
    if (typeof consoleMethod === 'function') {
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${logMessage}`);
    }
  }

  // Note: System diagnostics storage is handled separately by the admin panel
  // to avoid circular dependencies and build issues
}

export const logger = {
  info: (message: string, ...args: any[]) => fallbackLog('info', message, ...args),
  warn: (message: string, ...args: any[]) => fallbackLog('warn', message, ...args),
  error: (message: string, ...args: any[]) => fallbackLog('error', message, ...args),
  debug: (message: string, ...args: any[]) => fallbackLog('debug', message, ...args)
};
