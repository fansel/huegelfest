// Automatische App-Versionierung für Cache-Invalidierung
export const APP_VERSION = {
  // Version aus package.json + Build-Zeit
  version: '0.1.0',
  buildTime: '1748359755899',
  buildId: '70182804d05f45e0',
  
  // Development vs Production unterscheiden
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Cache-Namen mit automatischer Versionierung
  getCacheName: () => `huegelfest-cache-v${APP_VERSION.version}-${APP_VERSION.buildId}`,
  
  // Vollständiger App-Identifier
  getAppIdentifier: () => `${APP_VERSION.version}-${APP_VERSION.buildTime}`,
  
  // Check ob neue Version verfügbar
  isNewerThan: (storedVersion: string) => {
    return APP_VERSION.getAppIdentifier() !== storedVersion;
  },
  
  // Development: Sofortige Updates, Production: Controlled Updates
  shouldForceUpdate: () => {
    return APP_VERSION.isDevelopment;
  }
};

// LocalStorage Keys für Version-Tracking
export const VERSION_STORAGE_KEYS = {
  APP_VERSION: 'huegelfest_app_version',
  LAST_UPDATE_CHECK: 'huegelfest_last_update_check',
  UPDATE_AVAILABLE: 'huegelfest_update_available',
  USER_UPDATE_DISMISSED: 'huegelfest_user_dismissed_update'
}; 