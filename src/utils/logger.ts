// Simple logger that prevents sensitive info from appearing in production
const isDev = !import.meta.env.PROD;

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
  info: (...args: any[]) => {
    if (isDev) console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  // Backward compatibility - keeps existing console.log in dev
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  }
};