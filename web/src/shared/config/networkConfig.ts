/**
 * Netzwerk-Konfiguration für stabilere Verbindungen in instabilen Netzwerken
 * Optimiert für Uni-WLAN, schwache WiFi-Verbindungen und mobile Netzwerke
 */
export const NetworkConfig = {
  // Health Check Einstellungen
  healthCheck: {
    /** Basis-Intervall für regelmäßige Health Checks (ms) */
    regularInterval: 45000, // 45 Sekunden (statt 30)
    
    /** Minimum Zeit zwischen Health Checks (Rate Limiting) */
    minInterval: 15000, // 15 Sekunden (statt 10)
    
    /** Timeout für Health Check Requests */
    timeout: 8000, // 8 Sekunden (statt 3)
    
    /** Intervall für aggressive Checks nach Verbindungsproblemen */
    aggressiveInterval: 15000, // 15 Sekunden (statt 10)
    
    /** Anzahl der aggressiven Checks */
    aggressiveChecksCount: 6, // = 90 Sekunden total
  },

  // Connection Status Stabilisierung
  connectionStability: {
    /** Intervall für Connection Status Updates (ms) */
    statusCheckInterval: 5000, // 5 Sekunden (statt 2)
    
    /** Anzahl aufeinanderfolgender gleicher Status-Checks für Stabilität */
    stabilityThreshold: 3, // 3 Checks = 15 Sekunden total
    
    /** Debounce Zeit für Status-Änderungen (ms) */
    debounceDelay: 2000, // 2 Sekunden
  },

  // UI Verhalten
  ui: {
    /** Transition-Dauer für Status-Änderungen (ms) */
    transitionDuration: 1000, // 1 Sekunde
    
    /** Farben für verschiedene Verbindungsstatus */
    colors: {
      connected: 'green-500',
      stabilizing: 'orange-500', // Statt rot für "offline"
      offline: 'red-500',
    },
    
    /** Texte für Verbindungsstatus */
    labels: {
      connected: 'Live',
      stabilizing: 'Stabilisiert',
      offline: 'Offline',
      connectedDesktop: 'Live-Updates aktiv',
      stabilizingDesktop: 'Netzwerk stabilisiert sich',
      offlineDesktop: 'Keine Verbindung',
    }
  },

  // WebSocket Konfiguration
  websocket: {
    /** Basis-Delay für Reconnection (ms) */
    baseReconnectDelay: 1000,
    
    /** Maximum Reconnection Attempts */
    maxReconnectAttempts: 10,
    
    /** Maximum Reconnection Delay (ms) */
    maxReconnectDelay: 30000,
  }
};

export default NetworkConfig; 