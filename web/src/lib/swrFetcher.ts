import { logger } from './logger';

/**
 * Offline-Error für SWR
 * Wird geworfen wenn offline erkannt wird, damit SWR fallbackData verwendet
 */
export class OfflineError extends Error {
  constructor() {
    super('Offline detected');
    this.name = 'OfflineError';
  }
}

/**
 * SWR-Fetcher für Server Actions mit Offline-Unterstützung
 * 
 * Wirft OfflineError wenn offline, SWR verwendet dann automatisch fallbackData
 */
export async function serverActionFetcher<T>(action: () => Promise<T>): Promise<T> {
  try {
    // Network-Status prüfen
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      logger.debug('[SWR Fetcher] Offline detected, using cache');
      throw new OfflineError(); // SWR verwendet fallbackData
    }

    // Server Action ausführen
    const result = await action();
    return result;
  } catch (error: any) {
    // Bereits OfflineError durchleiten
    if (error instanceof OfflineError) {
      throw error;
    }

    // Network-Fehler abfangen (Offline)
    if (
      error?.name === 'TypeError' && 
      (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch'))
    ) {
      logger.debug('[SWR Fetcher] Network error detected (offline), using cache');
      throw new OfflineError(); // SWR verwendet fallbackData/cache
    }

    // Andere Fehler durchleiten
    logger.error('[SWR Fetcher] Unerwarteter Fehler:', error);
    throw error;
  }
}

/**
 * Wrapper für useSWR mit Server Actions
 * 
 * @param action - Server Action function
 */
export function createServerActionFetcher<T>(action: () => Promise<T>) {
  return () => serverActionFetcher(action);
} 