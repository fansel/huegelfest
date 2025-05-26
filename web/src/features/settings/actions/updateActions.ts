'use server';

import { APP_VERSION } from '@/lib/config/appVersion';
import { logger } from '@/lib/logger';
import { broadcast } from '@/lib/websocket/broadcast';

// Typisierung für globale Update-Funktionen
declare global {
  var broadcastForceUpdate: ((updateInfo: any) => void) | undefined;
  var broadcastAppUpdate: ((updateInfo: any) => void) | undefined;
}

/**
 * Server Action: Prüft auf App-Updates
 */
export async function checkForUpdatesAction(): Promise<{
  hasUpdate: boolean;
  updateInfo?: {
    appUpdate: boolean;
    assetUpdate: boolean;
    serviceWorkerUpdate: boolean;
  };
  currentVersion: string;
  error?: string;
}> {
  try {
    // Simuliere Update-Check basierend auf Build-ID
    const currentVersion = APP_VERSION.getAppIdentifier();
    
    // In einer echten Implementierung würde hier geprüft werden:
    // - Neue Build-IDs im Deployment
    // - Asset-Änderungen
    // - Service Worker Updates
    
    // Für Demo: Development hat öfter Updates
    const hasUpdate = APP_VERSION.isDevelopment 
      ? Math.random() > 0.5  // 50% Chance in Development
      : Math.random() > 0.8; // 20% Chance in Production

    if (hasUpdate) {
      const updateInfo = {
        appUpdate: true,
        assetUpdate: Math.random() > 0.5,
        serviceWorkerUpdate: Math.random() > 0.7
      };

      logger.info('[UpdateActions] Update verfügbar:', updateInfo);
      
      return {
        hasUpdate: true,
        updateInfo,
        currentVersion
      };
    }

    return {
      hasUpdate: false,
      currentVersion
    };

  } catch (error) {
    logger.error('[UpdateActions] Fehler beim Update-Check:', error);
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION.getAppIdentifier(),
      error: 'Update-Check fehlgeschlagen'
    };
  }
}

/**
 * Server Action: Benachrichtigt alle Clients über verfügbares Update
 */
export async function notifyClientsAboutUpdateAction(updateInfo: {
  appUpdate: boolean;
  assetUpdate: boolean;
  serviceWorkerUpdate: boolean;
}) {
  try {
    logger.info('[UpdateActions] Benachrichtige Clients über Update:', updateInfo);
    
    // WebSocket-Broadcast über bestehende Infrastruktur
    await broadcast('app-update-available', updateInfo);
    
    return { success: true };
  } catch (error) {
    logger.error('[UpdateActions] Fehler beim Benachrichtigen der Clients:', error);
    return { success: false, error: 'Benachrichtigung fehlgeschlagen' };
  }
}

/**
 * Server Action: Erzwingt Update für alle Clients (Admin-Funktion)
 */
export async function forceUpdateForAllClientsAction(reason?: string) {
  try {
    logger.info('[UpdateActions] Force-Update für alle Clients:', { reason });
    
    const updateInfo = {
      forced: true,
      reason: reason || 'Kritisches Update erforderlich',
      appUpdate: true,
      assetUpdate: true,
      serviceWorkerUpdate: true
    };

    // WebSocket-Broadcast über bestehende Infrastruktur
    await broadcast('force-update', updateInfo);
    
    return { success: true };
  } catch (error) {
    logger.error('[UpdateActions] Fehler beim Force-Update:', error);
    return { success: false, error: 'Force-Update fehlgeschlagen' };
  }
}

/**
 * Server Action: Holt aktuelle App-Informationen
 */
export async function getAppInfoAction() {
  return {
    version: APP_VERSION.version,
    buildTime: APP_VERSION.buildTime,
    buildId: APP_VERSION.buildId,
    environment: APP_VERSION.isDevelopment ? 'development' : 'production',
    identifier: APP_VERSION.getAppIdentifier()
  };
} 