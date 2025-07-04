import { useEffect, useState, useCallback, useRef } from 'react';

// Global singleton network manager
class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private status: NetworkStatus = {
    isOnline: true,
    isServerOnline: true,
    isBrowserOnline: true
  };
  private lastHealthCheckTime = 0;
  private healthCheckInterval?: NodeJS.Timeout;
  private aggressiveHealthCheckRef?: NodeJS.Timeout;
  private isInitialized = false;

  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Initialize on first subscription
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.initialize();
    }
    
    // Send current status immediately
    listener(this.status);
    
    return () => {
      this.listeners.delete(listener);
      // Cleanup if no more listeners
      if (this.listeners.size === 0) {
        this.cleanup();
      }
    };
  }

  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    // Set initial browser status
    this.status.isBrowserOnline = navigator.onLine;
    this.notifyListeners();
    
    // Initial health check
    this.checkServerConnection();

    // Event listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Weniger häufige Regular Health Checks (45 Sekunden statt 30)
    this.healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkServerConnection();
      } else {
        this.updateServerStatus(false);
      }
    }, 45000);
  }

  private cleanup() {
    if (!this.isInitialized) return;
    
    this.isInitialized = false;
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('focus', this.handleFocus);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.aggressiveHealthCheckRef) {
      clearInterval(this.aggressiveHealthCheckRef);
      this.aggressiveHealthCheckRef = undefined;
    }
  }

  private handleOnline = () => {
    console.log('[Network] Browser meldet Online - prüfe Server-Verbindung');
    this.status.isBrowserOnline = true;
    this.notifyListeners();
    this.forceHealthCheck();
  };

  private handleOffline = () => {
    console.log('[Network] Browser meldet Offline');
    this.status.isBrowserOnline = false;
    this.status.isServerOnline = false;
    this.status.isOnline = false;
    this.notifyListeners();
  };

  private handleFocus = () => {
    if (navigator.onLine) {
      this.forceHealthCheck();
    }
  };

  private handleVisibilityChange = () => {
    if (!document.hidden && navigator.onLine) {
      this.forceHealthCheck();
    }
  };

  private async checkServerConnection() {
    // Erhöhtes Rate Limiting: minimum 15 Sekunden zwischen Checks (statt 10)
    const now = Date.now();
    if (now - this.lastHealthCheckTime < 15000) {
      return;
    }
    
    this.lastHealthCheckTime = now;
    
    try {
      const cacheBuster = `?cb=${Date.now()}`;
      const response = await fetch(`/api/health${cacheBuster}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(8000), // Erhöht von 3000ms auf 8000ms für langsamere Netzwerke
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        if (!this.status.isServerOnline) {
          console.log('[Network] ✅ Server wieder erreichbar');
        }
        this.updateServerStatus(true);
      } else {
        console.warn('[Network] ❌ Server-Health-Check fehlgeschlagen:', response.status);
        this.updateServerStatus(false);
      }
    } catch (error) {
      console.warn('[Network] ❌ Server nicht erreichbar:', error);
      this.updateServerStatus(false);
    }
  }

  private updateServerStatus(isOnline: boolean) {
    const wasOnline = this.status.isServerOnline;
    this.status.isServerOnline = isOnline;
    this.status.isOnline = this.status.isBrowserOnline && this.status.isServerOnline;
    
    if (wasOnline !== isOnline) {
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  async forceHealthCheck() {
    this.lastHealthCheckTime = 0; // Reset rate limiting
    await this.checkServerConnection();
    
    // Weniger aggressive Checks für 90 Sekunden (statt 60)
    if (this.aggressiveHealthCheckRef) {
      clearInterval(this.aggressiveHealthCheckRef);
    }
    
    let checksCount = 0;
    this.aggressiveHealthCheckRef = setInterval(async () => {
      checksCount++;
      await this.checkServerConnection();
      
      if (checksCount >= 6) { // 6 checks = 90 Sekunden (15s * 6)
        if (this.aggressiveHealthCheckRef) {
          clearInterval(this.aggressiveHealthCheckRef);
          this.aggressiveHealthCheckRef = undefined;
        }
      }
    }, 15000); // Erhöht von 10000ms auf 15000ms
  }

  getCurrentStatus(): NetworkStatus {
    return { ...this.status };
  }
}

interface NetworkStatus {
  isOnline: boolean;
  isServerOnline: boolean;
  isBrowserOnline: boolean;
}

/**
 * React-Hook zur Überwachung des Netzwerkstatus (online/offline).
 * Erkennt auch "verbunden, aber kein Internet" Situationen durch Health-Checks.
 * SSR-safe: Startet mit true für Server-Rendering.
 */
export function useNetworkStatus(): { 
  isOnline: boolean; 
  isServerOnline: boolean;
  isBrowserOnline: boolean;
  forceHealthCheck: () => Promise<void> 
} {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isServerOnline: true,
    isBrowserOnline: true
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    const manager = NetworkStatusManager.getInstance();
    const unsubscribe = manager.subscribe(setStatus);
    
    return unsubscribe;
  }, []);

  const forceHealthCheck = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const manager = NetworkStatusManager.getInstance();
      await manager.forceHealthCheck();
      }
  }, []);

  // Während SSR und vor Hydration: Immer online annehmen
  if (!isHydrated) {
    return { 
      isOnline: true, 
      isServerOnline: true, 
      isBrowserOnline: true, 
      forceHealthCheck: async () => {} 
    };
  }

  return { 
    isOnline: status.isOnline, 
    isServerOnline: status.isServerOnline, 
    isBrowserOnline: status.isBrowserOnline, 
    forceHealthCheck 
  };
}

// Vereinfachte Version für Backward-Kompatibilität
export function useNetworkStatusSimple(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

// Zusätzlicher Export für direkte Boolean-Verwendung (Backward-Kompatibilität)
export function useOnlineStatus(): boolean {
  return useNetworkStatusSimple();
} 