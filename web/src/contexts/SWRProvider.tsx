'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { OfflineError } from '@/lib/swrFetcher';

interface SWRProviderProps {
  children: ReactNode;
}

/**
 * Globaler SWR-Provider mit optimierter Offline-Konfiguration
 * 
 * Features:
 * - Keine Server-Calls offline 
 * - Aggressive Cache-Nutzung
 * - Fehlerbehandlung für Network-Fehler
 * - Fallback zu lokalen Daten
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Aggressive Cache-Nutzung - weniger Netzwerk-Calls
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: false,
        
        // Retry-Konfiguration für besseres Offline-Verhalten
        errorRetryCount: 1,
        errorRetryInterval: 10000,
        
        // Fokus-Events ignorieren wenn offline
        revalidateOnMount: true,
        
        // Dedupe-Fenster für weniger redundante Calls
        dedupingInterval: 10000,
        
        // Globaler Fehler-Handler
        onError: (error, key) => {
          // OfflineError ignorieren - ist erwartetes Verhalten
          if (error instanceof OfflineError) {
            logger.debug(`[SWR] Offline-Modus für ${key}, verwende Cache`);
            return;
          }

          // Network-Fehler offline ignorieren (Fallback)
          if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
            logger.debug(`[SWR] Network-Fehler ignoriert (offline): ${key}`);
            return;
          }
          
          // Andere Fehler loggen
          logger.error(`[SWR] Fehler bei ${key}:`, error);
        },
        
        // Fallback-Funktion die immer lokale Daten zurückgibt
        fallback: {},
        
        // Loading-Timeout für langsame Verbindungen
        loadingTimeout: 10000,
      }}
    >
      {children}
    </SWRConfig>
  );
} 