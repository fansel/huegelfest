'use client';

import { SWRConfig } from 'swr';
import { ReactNode, useMemo } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

/**
 * Konfiguriert SWR für optimale Offline-Funktionalität:
 * - Verwendet localStorage für Offline-Caching mit sofortiger Persistierung
 * - Aktualisiert nur Daten wenn online
 * - Vermeidet unnötige Netzwerk-Requests bei Offline-Modus
 */
export function SWROfflineProvider({ children }: { children: ReactNode }) {
  const isOnline = useNetworkStatus();
  
  // SWR-Konfiguration dynamisch basierend auf Online-Status
  const swrConfig = useMemo(() => ({
    // Persistenter Cache mit localStorage (SSR-safe) - SOFORTIGE Persistierung
    provider: () => {
      // Map für In-Memory-Cache
      const cache = new Map();
      let isPeristing = false; // Verhindert Endlos-Loops
      
      // Hilfsfunktion: Cache sofort in localStorage speichern (OHNE Endlos-Loop)
      const persistCache = () => {
        if (isPeristing || typeof window === 'undefined' || typeof localStorage === 'undefined') {
          return;
        }
        
        isPeristing = true;
        try {
          const cacheObj: Record<string, any> = {};
          // Direkt auf die originale Map zugreifen, NICHT auf überschriebene Methoden
          for (const [key, value] of cache.entries()) {
            cacheObj[key] = value;
          }
          localStorage.setItem('swr-cache', JSON.stringify(cacheObj));
          console.log('[SWR] Cache sofort in localStorage gespeichert');
        } catch (error) {
          console.error('[SWR] Fehler beim Speichern des Caches:', error);
        } finally {
          isPeristing = false;
        }
      };
      
      // Nur im Browser: Cache aus localStorage laden
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          const localStorageCache = localStorage.getItem('swr-cache');
          if (localStorageCache) {
            const parsedCache = JSON.parse(localStorageCache);
            Object.keys(parsedCache).forEach(key => {
              // Direkt die originale set-Methode verwenden beim Laden
              cache.set(key, parsedCache[key]);
            });
            console.log('[SWR] Cache aus localStorage geladen');
          }
        } catch (error) {
          console.error('[SWR] Fehler beim Laden des Caches:', error);
        }
      }
      
      // Originale Map-Methoden sichern NACH dem Laden
      const originalSet = cache.set.bind(cache);
      const originalDelete = cache.delete.bind(cache);
      const originalClear = cache.clear.bind(cache);
      
      // Map-Methoden überschreiben für sofortige Persistierung
      cache.set = function(key, value) {
        const result = originalSet(key, value);
        if (!isPeristing) { // Nur persistieren wenn nicht bereits am persistieren
          persistCache();
        }
        return result;
      };
      
      cache.delete = function(key) {
        const result = originalDelete(key);
        if (!isPeristing) {
          persistCache();
        }
        return result;
      };
      
      cache.clear = function() {
        const result = originalClear();
        if (!isPeristing) {
          persistCache();
        }
        return result;
      };
      
      // Event-Listener nur einmal registrieren
      if (typeof window !== 'undefined') {
        let intervalId: NodeJS.Timeout | null = null;
        let hasRegisteredListeners = false;
        
        if (!hasRegisteredListeners) {
          // Periodisches Speichern alle 10 Sekunden
          intervalId = setInterval(persistCache, 10000);
          
          // Cleanup bei Page-Unload
          const cleanup = () => {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            persistCache(); // Ein letztes Mal speichern
          };
          
          window.addEventListener('beforeunload', cleanup);
          window.addEventListener('pagehide', cleanup); // Für mobile Browser
          
          hasRegisteredListeners = true;
        }
      }
      
      return cache;
    },
    
    // ✅ KRITISCH: Diese Werte werden bei jeder Netzwerk-Änderung neu berechnet
    shouldRetryOnError: isOnline,
    revalidateOnFocus: isOnline,
    revalidateOnReconnect: true,
    revalidateIfStale: isOnline,
    
    // Längere Fehler-Retry-Zeit im Offline-Modus
    errorRetryInterval: isOnline ? 5000 : 30000,
    
    // Cache-Daten behalten (dedupingInterval)
    dedupingInterval: 10000,
    
    // Lokaler Fallback und Behandlung von Online/Offline-Übergängen
    onError: (error: any, key: string) => {
      console.warn(`[SWR] Fehler beim Laden von "${key}"`, error);
      
      if (!isOnline) {
        console.log('[SWR] Offline-Modus: Verwende Cache-Daten für', key);
      }
    },
    
    // ✅ KRITISCH: Diese Funktionen werden bei jeder Netzwerk-Änderung neu erstellt
    isOnline: () => {
      // Aktuelle Online-Status zur Laufzeit prüfen
      return typeof window !== 'undefined' ? navigator.onLine : true;
    },
    isVisible: () => true,
    initFocus: (callback: () => void) => {
      // Nur im Browser und wenn online
      if (typeof window !== 'undefined' && isOnline) {
        window.addEventListener('focus', callback);
        return () => window.removeEventListener('focus', callback);
      }
      return () => {};
    },
    initReconnect: (callback: () => void) => {
      // Nur im Browser
      if (typeof window !== 'undefined') {
        window.addEventListener('online', callback);
        return () => window.removeEventListener('online', callback);
      }
      return () => {};
    },
  }), [isOnline]); // ✅ KRITISCH: useMemo dependency auf isOnline
  
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
} 