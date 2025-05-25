// Automatische App-Versionierung für Cache-Invalidierung
export const APP_VERSION = {
  // Version aus package.json + Build-Zeit
  version: '0.1.0',
  buildTime: '1748200543843',
  buildId: '3fbba42ac1a50c6b',
  
  // Cache-Namen mit automatischer Versionierung
  getCacheName: () => `huegelfest-cache-v${APP_VERSION.version}-${APP_VERSION.buildId}`,
  
  // Vollständiger App-Identifier
  getAppIdentifier: () => `${APP_VERSION.version}-${APP_VERSION.buildTime}`,
  
  // Check ob neue Version verfügbar
  isNewerThan: (storedVersion: string) => {
    return APP_VERSION.getAppIdentifier() !== storedVersion;
  }
};

// LocalStorage Keys für Version-Tracking
export const VERSION_STORAGE_KEYS = {
  APP_VERSION: 'huegelfest_app_version',
  LAST_UPDATE_CHECK: 'huegelfest_last_update_check',
  UPDATE_AVAILABLE: 'huegelfest_update_available'
}; 