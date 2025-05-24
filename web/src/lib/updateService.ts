import { APP_VERSION, VERSION_STORAGE_KEYS } from './config/appVersion';
import { logger } from './logger';
import toast from 'react-hot-toast';

export class UpdateService {
  private static instance: UpdateService;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private onUpdateCallback?: () => void;

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Initialisiert den Update-Service
   * Prüft bei App-Start auf verfügbare Updates
   */
  async initialize() {
    if (typeof window === 'undefined') return;

    logger.info('[UpdateService] Initialisierung gestartet');
    
    // Gespeicherte Version prüfen
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEYS.APP_VERSION);
    const currentVersion = APP_VERSION.getAppIdentifier();
    
    if (!storedVersion) {
      // Erste Installation
      localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, currentVersion);
      logger.info('[UpdateService] Erste Installation erkannt');
    } else if (APP_VERSION.isNewerThan(storedVersion)) {
      // Update verfügbar
      logger.info('[UpdateService] App-Update erkannt', { 
        old: storedVersion, 
        new: currentVersion 
      });
      await this.handleAppUpdate(storedVersion, currentVersion);
    }

    // Regelmäßige Update-Checks starten
    this.startPeriodicUpdateChecks();
  }

  /**
   * Behandelt ein erkanntes App-Update
   */
  private async handleAppUpdate(oldVersion: string, newVersion: string) {
    try {
      // 1. Cache invalidieren
      await this.invalidateAllCaches();
      
      // 2. LocalStorage für kritische Daten bereinigen (optional)
      await this.cleanupOldData();
      
      // 3. Version aktualisieren
      localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, newVersion);
      localStorage.setItem(VERSION_STORAGE_KEYS.LAST_UPDATE_CHECK, Date.now().toString());
      
      // 4. Benutzer benachrichtigen
      this.showUpdateNotification();
      
      // 5. Callback ausführen falls gesetzt
      if (this.onUpdateCallback) {
        this.onUpdateCallback();
      }

      logger.info('[UpdateService] App-Update erfolgreich verarbeitet');
    } catch (error) {
      logger.error('[UpdateService] Fehler beim Update-Handling:', error);
    }
  }

  /**
   * Invalidiert alle Browser-Caches
   */
  private async invalidateAllCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          logger.info('[UpdateService] Lösche Cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }

    // Service Worker neu registrieren falls verfügbar
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        logger.info('[UpdateService] Service Worker aktualisiert');
      }
    }
  }

  /**
   * Bereinigt veraltete LocalStorage-Daten
   */
  private async cleanupOldData() {
    // Kritische Keys die NICHT gelöscht werden sollen
    const preserveKeys = [
      'huegelfest_device_id',
      'huegelfest_auth_token',
      'huegelfest_user_settings',
      'huegelfest_push_subscription',
      VERSION_STORAGE_KEYS.APP_VERSION,
      VERSION_STORAGE_KEYS.LAST_UPDATE_CHECK
    ];

    // Veraltete Cache-Keys bereinigen
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith('huegelfest_') && 
      !preserveKeys.includes(key) &&
      (key.includes('cache') || key.includes('old') || key.includes('temp'))
    );

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      logger.info('[UpdateService] Bereinige veralteten Key:', key);
    });
  }

  /**
   * Zeigt eine benutzerfreundliche Update-Benachrichtigung
   */
  private showUpdateNotification() {
    toast.success(
      'App wurde aktualisiert! 🎉\nNeue Features und Verbesserungen sind verfügbar.',
      {
        duration: 5000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      }
    );
  }

  /**
   * Startet periodische Update-Checks (alle 30 Minuten)
   */
  private startPeriodicUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    this.updateCheckInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, 30 * 60 * 1000); // 30 Minuten
  }

  /**
   * Prüft auf verfügbare Updates durch Service Worker
   */
  private async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          // Prüfen ob neuer Service Worker verfügbar
          if (registration.waiting) {
            logger.info('[UpdateService] Neuer Service Worker verfügbar');
            localStorage.setItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE, 'true');
            this.showUpdateAvailableNotification();
          }
        }
      } catch (error) {
        logger.error('[UpdateService] Fehler beim Update-Check:', error);
      }
    }
  }

  /**
   * Zeigt Benachrichtigung für verfügbares Update
   */
  private showUpdateAvailableNotification() {
    toast(
      'Neue App-Version verfügbar!\nSchließe die App und öffne sie erneut.',
      {
        duration: 8000,
        icon: '🔄',
        style: {
          background: '#F59E0B',
          color: 'white',
        },
      }
    );
  }

  /**
   * Erzwingt ein komplettes App-Reload mit Cache-Clearing
   */
  async forceReload() {
    try {
      await this.invalidateAllCaches();
      
      // Hard reload
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      window.location.reload();
    } catch (error) {
      logger.error('[UpdateService] Fehler beim Force-Reload:', error);
      window.location.reload(); // Fallback
    }
  }

  /**
   * Registriert Callback für Update-Events
   */
  onUpdate(callback: () => void) {
    this.onUpdateCallback = callback;
  }

  /**
   * Cleanup beim Unmount
   */
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  /**
   * Gibt aktuelle Version-Infos zurück
   */
  getVersionInfo() {
    return {
      current: APP_VERSION.getAppIdentifier(),
      stored: localStorage.getItem(VERSION_STORAGE_KEYS.APP_VERSION),
      lastCheck: localStorage.getItem(VERSION_STORAGE_KEYS.LAST_UPDATE_CHECK),
      updateAvailable: localStorage.getItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE) === 'true'
    };
  }
}

// Singleton Export
export const updateService = UpdateService.getInstance(); 