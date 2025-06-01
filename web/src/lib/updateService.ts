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
  private backgroundCheckInterval: NodeJS.Timeout | null = null;
  private storageEventListener: ((e: StorageEvent) => void) | null = null;

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
      this.setupStorageListener();
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
      this.removeStorageListener();
      this.onUpdateCallback = null;
      this.hasShownUpdateNotification = false;
      logger.info('[UpdateService] Update-Service erfolgreich zerstört');
    } catch (error) {
      logger.error('[UpdateService] Fehler beim Zerstören:', error);
    }
  }

  /**
   * Storage-Event-Listener für sofortige Updates der UI
   */
  private setupStorageListener() {
    if (typeof window === 'undefined') return;

    this.storageEventListener = (e: StorageEvent) => {
      if (e.key === VERSION_STORAGE_KEYS.UPDATE_AVAILABLE) {
        // Sofortiges Update der UI ohne Reload
        const hasUpdate = e.newValue === 'true';
        logger.info('[UpdateService] Storage Update erkannt:', hasUpdate);
        
        // Trigger custom event für UI-Updates
        window.dispatchEvent(new CustomEvent('updateAvailableChange', {
          detail: { available: hasUpdate }
        }));
      }
    };

    window.addEventListener('storage', this.storageEventListener);
  }

  private removeStorageListener() {
    if (this.storageEventListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener);
      this.storageEventListener = null;
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
    
    // Automatische Background-Checks alle 30 Sekunden
    this.startBackgroundUpdateChecks();
    
    logger.info('[UpdateService] Update-Service mit automatischen Checks gestartet');
  }

  stopAutoUpdateCheck() {
    this.isInitialized = false;
    // Background-Checks stoppen
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
      this.backgroundCheckInterval = null;
    }
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
        
        // Reset des Update-Status und Flags
        this.hasShownUpdateNotification = false;
        localStorage.removeItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE);
        localStorage.removeItem(VERSION_STORAGE_KEYS.USER_UPDATE_DISMISSED);
        
        if (APP_VERSION.shouldForceUpdate()) {
          // Development: Sofort anwenden
          await this.applyUpdatesImmediately({ appUpdate: true });
        } else {
          // Production: Version sofort aktualisieren, aber trotzdem User informieren
          localStorage.setItem(VERSION_STORAGE_KEYS.APP_VERSION, currentVersion);
          
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
   * WebSocket Message Handler - verarbeitet Update-Events vom Server
   */
  handleWebSocketMessage(msg: UpdateWebSocketMessage) {
    logger.info('[UpdateService] WebSocket Update-Message empfangen:', msg);
    
    switch (msg.topic) {
      case 'app-update-available':
        // Reset Flags für neue Updates
        this.hasShownUpdateNotification = false;
        this.handleUpdateFound({
          appUpdate: true,
          assetUpdate: msg.payload?.assetUpdate || false,
          serviceWorkerUpdate: msg.payload?.serviceWorkerUpdate || false
        });
        break;
        
      case 'update-status-initial':
        // NEU: Initial-Status vom Server beim Connect
        logger.info('[UpdateService] Initial Update-Status empfangen:', msg.payload);
        if (msg.payload?.available) {
          // Update verfügbar - behandeln
          this.hasShownUpdateNotification = false;
          this.handleUpdateFound({
            appUpdate: true,
            assetUpdate: true,
            serviceWorkerUpdate: false
          });
        } else {
          // Kein Update - Status synchronisieren
          localStorage.removeItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE);
          this.triggerUpdateAvailableEvent(false);
        }
        break;
        
      case 'force-update':
        // Erzwungene Updates (Critical Updates)
        logger.info('[UpdateService] Force Update empfangen');
        this.applyUpdatesImmediately({
          appUpdate: true,
          assetUpdate: true,
          serviceWorkerUpdate: true
        });
        break;
        
      default:
        logger.warn('[UpdateService] Unbekannte WebSocket-Message:', msg.topic);
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
    
    // Prüfe ob bereits ein Update für diese Version behandelt wurde
    const currentVersion = APP_VERSION.getAppIdentifier();
    const lastHandledVersion = localStorage.getItem(VERSION_STORAGE_KEYS.LAST_HANDLED_UPDATE);
    
    if (lastHandledVersion === currentVersion && this.hasShownUpdateNotification) {
      logger.info('[UpdateService] Update für diese Version bereits behandelt');
      return;
    }
    
    if (APP_VERSION.shouldForceUpdate()) {
      // Development: Sofortige Updates
      await this.applyUpdatesImmediately(updates);
    } else {
      // Production: User Notification
      await this.notifyUserAboutUpdate(updates);
    }
    
    // Markiere Version als behandelt
    localStorage.setItem(VERSION_STORAGE_KEYS.LAST_HANDLED_UPDATE, currentVersion);
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
    
    if (userDismissed === currentVersion && this.hasShownUpdateNotification) {
      return; // User hat dieses Update bereits dismissed
    }
    
    if (this.hasShownUpdateNotification) {
      return; // Bereits gezeigt in dieser Session
    }
    
    this.hasShownUpdateNotification = true;
    
    // Badge API für PWA-Icon
    this.setBadge();
    
    // Update-Benachrichtigung
    const updateMessage = 'Update verfügbar';
    
    toast.success(updateMessage, {
      duration: 6000,
      position: 'top-center',
      style: {
        maxWidth: '200px',
        textAlign: 'center',
        marginTop: '20px'
      }
    });
    
    // Set flag für Settings-Integration
    localStorage.setItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE, 'true');
    
    // Sofortiges UI-Update durch Custom Event
    this.triggerUpdateAvailableEvent(true);
    
    logger.info('[UpdateService] User über Update benachrichtigt');
  }

  /**
   * Trigger Custom Event für sofortige UI-Updates
   */
  private triggerUpdateAvailableEvent(available: boolean) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('updateAvailableChange', {
        detail: { available }
      }));
    }
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
    
    // 5. Reset Update-Flags
    this.hasShownUpdateNotification = false;
    
    // 6. UI sofort updaten
    this.triggerUpdateAvailableEvent(false);
    
    // 7. Reload
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
    localStorage.setItem(VERSION_STORAGE_KEYS.LAST_HANDLED_UPDATE, currentVersion);
    localStorage.removeItem(VERSION_STORAGE_KEYS.UPDATE_AVAILABLE);
    localStorage.removeItem(VERSION_STORAGE_KEYS.USER_UPDATE_DISMISSED);
    
    logger.info('[UpdateService] Storage-Versionen aktualisiert:', currentVersion);
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
   * Erzwinge Update (für Settings)
   */
  async forceUpdate() {
    toast.loading('Update wird erzwungen...', { duration: 2000 });
    await this.applyUpdate();
  }

  /**
   * Startet automatische Background-Update-Checks
   */
  private startBackgroundUpdateChecks() {
    // Checks alle 30 Sekunden im Hintergrund
    this.backgroundCheckInterval = setInterval(async () => {
      try {
        await this.performAutomaticUpdateCheck();
      } catch (error) {
        logger.warn('[UpdateService] Background-Check Fehler:', error);
      }
    }, 30000); // 30 Sekunden

    logger.info('[UpdateService] Automatische Background-Checks gestartet (alle 30s)');
  }

  /**
   * Automatischer Update-Check im Hintergrund
   */
  private async performAutomaticUpdateCheck() {
    if (!this.isInitialized) return;

    try {
      // 1. Service Worker Updates prüfen
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration?.waiting) {
        logger.info('[UpdateService] Service Worker Update automatisch erkannt');
        this.handleWebSocketMessage({
          topic: 'app-update-available',
          payload: {
            serviceWorkerUpdate: true,
            appUpdate: false,
            assetUpdate: true
          }
        });
        return;
      }

      // 2. App-Version prüfen (für den Fall dass buildTime sich geändert hat)
      const currentVersion = APP_VERSION.getAppIdentifier();
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEYS.APP_VERSION);
      
      if (storedVersion && storedVersion !== currentVersion) {
        logger.info('[UpdateService] App-Version Update automatisch erkannt');
        this.handleWebSocketMessage({
          topic: 'app-update-available',
          payload: {
            serviceWorkerUpdate: false,
            appUpdate: true,
            assetUpdate: true
          }
        });
        return;
      }

      // 3. Prüfe ob Service Worker sich neu registriert hat
      if (registration) {
        registration.update(); // Force Service Worker Update Check
      }

    } catch (error) {
      // Stille Fehler im Background-Check
      logger.debug('[UpdateService] Background-Check silent error:', error);
    }
  }
}

// Singleton Export
export const updateService = UpdateService.getInstance(); 