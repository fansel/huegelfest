// Einfacher Logger für den Server
const logger = {
  info: (...args: unknown[]) => {
    process.stdout.write(`\x1b[32m[INFO]\x1b[0m ${new Date().toISOString()} `);
    console.log(...args);
  },
  error: (...args: unknown[]) => {
    process.stderr.write(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} `);
    console.error(...args);
  },
  warn: (...args: unknown[]) => {
    process.stdout.write(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} `);
    console.warn(...args);
  },
  debug: (...args: unknown[]) => {
    process.stdout.write(`\x1b[36m[DEBUG]\x1b[0m ${new Date().toISOString()} `);
    console.debug(...args);
  }
};

export { logger };
