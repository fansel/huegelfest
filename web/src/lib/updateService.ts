import { APP_VERSION, VERSION_STORAGE_KEYS } from './config/appVersion';
import { logger } from './logger';
import toast from 'react-hot-toast';

// Interface für WebSocket-Messages (ohne Hook-Dependencies)
export interface UpdateWebSocketMessage {
  topic: string;
  payload: any;
}

/**
 * WebSocket-basierter Update-Service
 * - Nutzt bestehende WebSocket-Infrastruktur
 * - Lauscht auf broadcast-Events
 * - Intelligente Reconnection
 */
export class UpdateService {
  private static instance: UpdateService;
  private onUpdateCallback: (() => void) | null = null;
  private hasShownUpdateNotification = false;
  private isInitialized = false;

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Initialisiert den Update-Service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.startAutoUpdateCheck();
      logger.info('[UpdateService] Update-Service erfolgreich initialisiert');
    } catch (error) {
      logger.error('[UpdateService] Fehler bei der Initialisierung:', error);
    }
  }

  /**
   * Zerstört den Update-Service und räumt Ressourcen auf
   */
  destroy() {
    try {
      this.stopAutoUpdateCheck();
      this.onUpdateCallback = null;
      this.hasShownUpdateNotification = false;
      logger.info('[UpdateService] Update-Service erfolgreich zerstört');
    } catch (error) {
      logger.error('[UpdateService] Fehler beim Zerstören:', error);
    }
  }

  /**
   * Startet Update-Service über bestehende WebSocket-Infrastruktur
   */
  startAutoUpdateCheck(callback?: () => void) {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.onUpdateCallback = callback || null;
    this.isInitialized = true;
    
    // Sofortiger Initial-Check
    this.checkForUpdatesInitial();
    
    logger.info('[UpdateService] Update-Service über bestehende WebSocket-Infrastruktur gestartet');
  }

  stopAutoUpdateCheck() {
    this.isInitialized = false;
    // WebSocket wird vom globalen useWebSocket-Hook verwaltet
  }

  /**
   * Initial Update-Check beim App-Start
   */
  private async checkForUpdatesInitial() {
    try {
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEYS.APP_VERSION);
      const currentVersion = APP_VERSION.getAppIdentifier();
      
      if (!storedVersion) {
        // Erste Installation - Version speichern
        localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, currentVersion);
        logger.info('[UpdateService] Erste Installation erkannt');
        return;
      }
      
      if (storedVersion !== currentVersion) {
        // Update erkannt beim Start
        logger.info('[UpdateService] App-Update beim Start erkannt');
        
        if (APP_VERSION.shouldForceUpdate()) {
          // Development: Sofort anwenden
          await this.applyUpdatesImmediately({ appUpdate: true });
        } else {
          // Production: User benachrichtigen
          await this.notifyUserAboutUpdate({ 
            appUpdate: true, 
            assetUpdate: false, 
            serviceWorkerUpdate: false 
          });
        }
      }
      
    } catch (error) {
      logger.error('[UpdateService] Fehler beim Initial-Check:', error);
    }
  }

  /**
   * Behandelt WebSocket-Events (wird vom globalen WebSocket-Hook aufgerufen)
   */
  handleWebSocketMessage(msg: UpdateWebSocketMessage) {
    if (!this.isInitialized) return;

    logger.info('[UpdateService] WebSocket-Event empfangen:', msg);
    
    switch (msg.topic) {
      case 'app-update-available':
        this.handleUpdateFound({
          appUpdate: true,
          assetUpdate: msg.payload?.assetUpdate || false,
          serviceWorkerUpdate: msg.payload?.serviceWorkerUpdate || false
        });
        break;
        
      case 'force-update':
        // Admin-Force-Update
        logger.info('[UpdateService] Admin-Force-Update empfangen');
        this.applyUpdatesImmediately(msg.payload || {});
        break;
        
      default:
        // Ignoriere andere Topics
        break;
    }
  }

  /**
   * Behandelt gefundene Updates basierend auf Environment
   */
  private async handleUpdateFound(updates: {
    appUpdate: boolean;
    assetUpdate: boolean;
    serviceWorkerUpdate: boolean;
  }) {
    logger.info('[UpdateService] Updates via WebSocket erhalten:', updates);
    
    if (APP_VERSION.shouldForceUpdate()) {
      // Development: Sofortige Updates
      await this.applyUpdatesImmediately(updates);
    } else {
      // Production: User Notification
      await this.notifyUserAboutUpdate(updates);
    }
  }

  /**
   * Development: Sofortige Updates ohne User-Interaktion
   */
  private async applyUpdatesImmediately(updates: any) {
    logger.info('[UpdateService] Development: Wende Updates sofort an');
    
    // 1. Storage updates
    await this.updateStorageVersions();
    
    // 2. Caches invalidieren
    await this.invalidateAllCaches();
    
    // 3. Service Worker überspringen
    await this.skipWaitingServiceWorker();
    
    // 4. Reload (nach kurzer Verzögerung)
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    toast.success('Development: App wurde aktualisiert', {
      duration: 2000,
      icon: '🔄'
    });
  }

  /**
   * Production: User-freundliche Update-Benachrichtigung
   */
  private async notifyUserAboutUpdate(updates: any) {
    // Prüfe ob User Update bereits dismissed hat
    const userDismissed = localStorage.getItem(VERSION_STORAGE_KEYS.USER_UPDATE_DISMISSED);
    const currentVersion = APP_VERSION.getAppIdentifier();
    
    if (userDismissed === currentVersion && !this.hasShownUpdateNotification) {
      return; // User hat dieses Update bereits dismissed
    }
    
    if (this.hasShownUpdateNotification) {
      return; // Bereits gezeigt in dieser Session
    }
    
    this.hasShownUpdateNotification = true;
    
    // Badge API für PWA-Icon
    this.setBadge();
    
    // Update-Benachrichtigung
    let updateMessage = '🎉 Update verfügbar!\n';
    if (updates.appUpdate) updateMessage += '✨ Neue Funktionen\n';
    if (updates.assetUpdate) updateMessage += '🎨 Design-Updates\n';
    if (updates.serviceWorkerUpdate) updateMessage += '⚡ Verbesserte Offline-Funktionen\n';
    updateMessage += '\n👆 Öffne Einstellungen zum Aktualisieren';
    
    toast.success(updateMessage, {
      duration: 10000,
      position: 'bottom-center',
      style: {
        maxWidth: '400px',
        textAlign: 'center'
      }
    });
    
    // Set flag für Settings-Integration
    localStorage.setItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE, 'true');
    
    logger.info('[UpdateService] User über Update benachrichtigt');
  }

  /**
   * User möchte Update anwenden
   */
  private async applyUpdate() {
    toast.loading('Update wird angewendet...', { duration: 2000 });
    
    // 1. Storage updates
    await this.updateStorageVersions();
    
    // 2. Cache invalidieren
    await this.invalidateAllCaches();
    
    // 3. Service Worker aktivieren
    await this.skipWaitingServiceWorker();
    
    // 4. Badge entfernen
    this.clearBadge();
    
    // 5. Reload
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  /**
   * Intelligente Cache-Invalidierung
   */
  private async invalidateAllCaches() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      
      // In Development: Alle Caches löschen
      if (APP_VERSION.isDevelopment) {
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        logger.info(`[UpdateService] Development: Alle Caches gelöscht (${cacheNames.length})`);
      } else {
        // In Production: Nur alte Caches löschen
        const currentCacheName = APP_VERSION.getCacheName();
        const oldCaches = cacheNames.filter(name => name !== currentCacheName);
        await Promise.all(oldCaches.map(name => caches.delete(name)));
        logger.info(`[UpdateService] Production: Alte Caches gelöscht (${oldCaches.length})`);
      }

      // Service Worker benachrichtigen
      await this.notifyServiceWorker('CACHE_INVALIDATED');

    } catch (error) {
      logger.error('[UpdateService] Fehler beim Cache-Invalidierung:', error);
    }
  }

  /**
   * Aktualisiert alle Storage-Versionen
   */
  private async updateStorageVersions() {
    const currentVersion = APP_VERSION.getAppIdentifier();
    
    localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, currentVersion);
    localStorage.setItem(VERSION_STORAGE_KEYS.LAST_UPDATE_CHECK, Date.now().toString());
    localStorage.removeItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE);
    localStorage.removeItem(VERSION_STORAGE_KEYS.USER_UPDATE_DISMISSED);
  }

  /**
   * Service Worker Skip Waiting
   */
  private async skipWaitingServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        logger.info('[UpdateService] Service Worker Skip Waiting ausgelöst');
      }
    } catch (error) {
      logger.warn('[UpdateService] Skip Waiting fehlgeschlagen:', error);
    }
  }

  /**
   * Service Worker Kommunikation
   */
  private async notifyServiceWorker(type: string, data?: any) {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type, data });
      }
    } catch (error) {
      logger.warn('[UpdateService] Service Worker Kommunikation fehlgeschlagen:', error);
    }
  }

  /**
   * Badge API für PWA-Icon
   */
  private setBadge() {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge().catch(() => {
        // Ignoriere Fehler - Badge ist optional
      });
    }
  }

  private clearBadge() {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {
        // Ignoriere Fehler - Badge ist optional
      });
    }
  }

  /**
   * Public API für manuelle Updates (Settings)
   */
  async checkForUpdatesManual(): Promise<boolean> {
    toast.loading('Prüfe auf Updates...', { duration: 1000 });
    
    // Simuliere Update-Check (in echter App würde hier Server Action aufgerufen)
    const hasUpdate = Math.random() > 0.7; // 30% Chance
    
    if (hasUpdate) {
      localStorage.setItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE, 'true');
    }
    
    return hasUpdate;
  }

  /**
   * Erzwinge Update (für Settings)
   */
  async forceUpdate() {
    toast.loading('Update wird erzwungen...', { duration: 2000 });
    await this.applyUpdate();
  }
}

// Singleton Export
export const updateService = UpdateService.getInstance(); 