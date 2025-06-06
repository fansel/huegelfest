'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useEffect, useCallback } from 'react';

// Debug nur in Entwicklung aktivieren
const DEBUG = process.env.NODE_ENV === 'development' && false;

/**
 * Konfiguriert SWR für optimale Offline-Funktionalität:
 * - Verwendet localStorage für Offline-Caching
 * - Aktualisiert nur Daten wenn online
 * - Vermeidet unnötige Netzwerk-Requests bei Offline-Modus
 */
export function SWROfflineProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetworkStatus();
  
  // Cache aus localStorage laden
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem('swr-cache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        if (DEBUG) {
          console.log('[SWR] Cache aus localStorage geladen:', Object.keys(parsedCache));
        }
      }
    } catch (error) {
      console.error('[SWR] Fehler beim Laden des Cache:', error);
    }
  }, []);

  return (
    <SWRConfig
      value={{
        // Persistenter Cache mit localStorage (SSR-safe)
        provider: () => {
          // Map für In-Memory-Cache
          const cache = new Map();
          
          // Nur im Browser: Cache aus localStorage laden
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
              const localStorageCache = localStorage.getItem('swr-cache');
              if (localStorageCache) {
                const parsedCache = JSON.parse(localStorageCache);
                Object.keys(parsedCache).forEach(key => {
                  cache.set(key, parsedCache[key]);
                });
                if (DEBUG) {
                  console.log('[SWR] Cache aus localStorage geladen:', Object.keys(parsedCache));
                }
              }
            } catch (error) {
              console.error('[SWR] Fehler beim Laden des Caches:', error);
            }
            
            // Bei Änderungen: Cache in localStorage speichern (auch während der Nutzung)
            const saveCache = () => {
              try {
                const cacheObj: Record<string, any> = {};
                for (const [key, value] of cache.entries()) {
                  cacheObj[key] = value;
                }
                localStorage.setItem('swr-cache', JSON.stringify(cacheObj));
                if (DEBUG) {
                  console.log('[SWR] Cache in localStorage gespeichert:', Object.keys(cacheObj));
                }
              } catch (error) {
                console.error('[SWR] Fehler beim Speichern des Caches:', error);
              }
            };
            
            // Cache bei verschiedenen Events speichern
            window.addEventListener('beforeunload', saveCache);
            window.addEventListener('pagehide', saveCache);
            
            // Regelmäßig Cache speichern (alle 30 Sekunden)
            const intervalId = setInterval(saveCache, 30000);
            
            // Cleanup
            const originalClear = cache.clear;
            cache.clear = function() {
              originalClear.call(this);
              // Auch localStorage leeren
              localStorage.removeItem('swr-cache');
            };
          }
          
          return cache;
        },
        
        // Fetcher im Offline-Modus deaktivieren
        shouldRetryOnError: isOnline,
        revalidateOnFocus: isOnline,
        revalidateOnReconnect: true,
        revalidateIfStale: isOnline,
        
        // Längere Fehler-Retry-Zeit im Offline-Modus
        errorRetryInterval: isOnline ? 5000 : 30000,
        
        // Cache-Daten behalten (dedupingInterval)
        dedupingInterval: 10000,
        
        // Lokaler Fallback und Behandlung von Online/Offline-Übergängen
        onError: (error, key) => {
          console.warn(`[SWR] Fehler beim Laden von "${key}"`, error);
          
          if (!isOnline) {
            if (DEBUG) {
              console.log('[SWR] Offline-Modus: Verwende Cache-Daten für', key);
            }
          }
        },
        
        // Bessere Cache-Nutzung im Offline-Modus
        onSuccess: (data, key) => {
          if (isOnline && DEBUG) {
            console.log(`[SWR] Erfolgreich geladen: "${key}"`);
          }
        },
        
        // SWR-Daten im Offline-Modus als frisch betrachten
        isOnline: () => isOnline,
        isVisible: () => true,
        initFocus: (callback) => {
          // Nur im Browser und wenn online
          if (typeof window !== 'undefined' && isOnline) {
            window.addEventListener('focus', callback);
            return () => window.removeEventListener('focus', callback);
          }
          return () => {};
        },
        initReconnect: (callback) => {
          // Nur im Browser
          if (typeof window !== 'undefined') {
            window.addEventListener('online', callback);
            return () => window.removeEventListener('online', callback);
          }
          return () => {};
        },
      }}
    >
      {children}
    </SWRConfig>
  );
} 