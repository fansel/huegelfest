import { useEffect, useState, useCallback } from 'react';

/**
 * React-Hook zur Überwachung des Netzwerkstatus (online/offline).
 * Erkennt auch "verbunden, aber kein Internet" Situationen durch Health-Checks.
 * SSR-safe: Startet mit true für Server-Rendering.
 */
export function useNetworkStatus(): boolean {
  // Starte mit null für SSR-Kompatibilität, dann echter Wert
  const [isOnline, setIsOnline] = useState<boolean>(true); // Default online für SSR
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastHealthCheckTime, setLastHealthCheckTime] = useState(0);
  
  // Tatsächliche Internetverbindung prüfen (nicht nur WiFi-Verbindung)
  const checkInternetConnection = useCallback(async () => {
    // Nur alle 10 Sekunden prüfen, um Performance-Probleme zu vermeiden
    const now = Date.now();
    if (now - lastHealthCheckTime < 10000) {
      return;
    }
    
    setLastHealthCheckTime(now);
    
    try {
      // Prüfen mit Cachebuster-Parameter um Cache zu vermeiden
      const cacheBuster = `?cb=${Date.now()}`;
      // Optimiert für schnelle Antwort und minimale Bandbreite
      const response = await fetch(`/api/health${cacheBuster}`, { 
        method: 'HEAD',
        // Abbrechen nach 3 Sekunden
        signal: AbortSignal.timeout(3000),
        // Cache verhindern
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Wenn der Server antwortet, haben wir Internet
      if (response.ok) {
        if (!isOnline) {
          console.log('[Network] Internetverbindung wieder hergestellt');
          setIsOnline(true);
        }
      } else {
        console.warn('[Network] Gesundheitscheck fehlgeschlagen mit Status:', response.status);
        setIsOnline(false);
      }
    } catch (error) {
      // Bei Timeout oder Netzwerkfehler: Offline
      console.warn('[Network] Kein Internet trotz Browser-Online-Status:', error);
      setIsOnline(false);
    }
  }, [isOnline, lastHealthCheckTime]);

  useEffect(() => {
    // Nach Hydration: Echten Navigator-Status setzen
    setIsOnline(navigator.onLine);
    setIsHydrated(true);
    
    // Sofort einen Health-Check durchführen
    checkInternetConnection();

    const handleOnline = () => {
      console.log('[Network] Browser meldet Online');
      // Browser sagt online, aber wir prüfen echte Verbindung
      checkInternetConnection();
    };
    
    const handleOffline = () => {
      console.log('[Network] Browser meldet Offline');
      setIsOnline(false);
    };
    
    // Regelmäßig prüfen (alle 30 Sekunden)
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        checkInternetConnection();
      }
    }, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [checkInternetConnection]);

  // Während SSR und vor Hydration: Immer online annehmen
  if (!isHydrated) {
    return true;
  }

  return isOnline;
} 