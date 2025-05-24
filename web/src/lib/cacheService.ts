import { logger } from './logger';

/**
 * Minimaler Cache-Service nur für App-Updates
 * SWR + WebSockets machen das Daten-Caching
 */

export class CacheService {
  private static instance: CacheService;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Invalidiert kompletten Cache bei App-Updates
   */
  async invalidateAll(silent: boolean = false) {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      if (!silent) {
        logger.info(`[CacheService] Kompletter Cache invalidiert (${cacheNames.length} Caches)`);
      }

      // Service Worker benachrichtigen
      await this.notifyServiceWorker();

    } catch (error) {
      logger.error('[CacheService] Fehler beim Invalidieren des Cache:', error);
    }
  }

  /**
   * Benachrichtigt Service Worker über App-Update
   */
  private async notifyServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'APP_UPDATE_INVALIDATE'
        });
      }
    } catch (error) {
      logger.error('[CacheService] Fehler beim Benachrichtigen des Service Workers:', error);
    }
  }

  /**
   * Forced Reload nach App-Updates
   */
  async invalidateAndReload() {
    await this.invalidateAll(false);
    
    // Kurz warten damit Cache-Invalidierung abgeschlossen ist
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}

// Singleton Export
export const cacheService = CacheService.getInstance(); 