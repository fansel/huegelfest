'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useServerStatus } from '@/shared/hooks/useServerStatus';

interface NetworkContextType {
  isOnline: boolean;
  isServerOnline: boolean;
  isBrowserOnline: boolean;
  isFullyOnline: boolean;
  lastOnlineTime: number | null;
  offlineDuration: number;
  hasBeenOnline: boolean;
  isInteractiveDisabled: (actionType: 'write' | 'update' | 'delete' | 'read') => boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

/**
 * Provider für Netzwerk-Status und offline-bezogene Funktionen
 * Nutzt sowohl Browser- als auch Server-Status für komplette Offline-Erkennung
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const { isServerOnline, isBrowserOnline, isFullyOnline } = useServerStatus();
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  const [hasBeenOnline, setHasBeenOnline] = useState(isFullyOnline);
  const [offlineDuration, setOfflineDuration] = useState(0);
  
  // Letzten Online-Zeitpunkt tracken (basierend auf vollständigem Online-Status)
  useEffect(() => {
    if (isFullyOnline) {
      setLastOnlineTime(Date.now());
      setHasBeenOnline(true);
      setOfflineDuration(0);
    } else if (lastOnlineTime) {
      // Offline-Zeit berechnen und jede Sekunde aktualisieren
      const timer = setInterval(() => {
        const duration = Math.floor((Date.now() - lastOnlineTime) / 1000);
        setOfflineDuration(duration);
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isFullyOnline, lastOnlineTime]);

  // Initiale Zeit setzen wenn online
  useEffect(() => {
    if (isFullyOnline && lastOnlineTime === null) {
      setLastOnlineTime(Date.now());
      setHasBeenOnline(true);
    }
  }, [isFullyOnline, lastOnlineTime]);

  /**
   * Prüft ob eine Interaktion basierend auf Netzwerkstatus deaktiviert werden sollte
   * Berücksichtigt sowohl Browser- als auch Server-Offline-Status
   */
  const isInteractiveDisabled = (actionType: 'write' | 'update' | 'delete' | 'read'): boolean => {
    // Wenn vollständig online (Browser UND Server), alles erlauben
    if (isFullyOnline) return false;
    
    // Im Offline-Modus (Browser ODER Server offline):
    switch (actionType) {
      // Schreiboperationen immer verbieten wenn Browser oder Server offline
      case 'write':
      case 'update':
      case 'delete':
        return true;
      
      // Leseoperationen erlauben - werden vom SWR/Cache bedient
      case 'read':
        return false;
      
      default:
        return true;
    }
  };

  const value = {
    isOnline: isFullyOnline, // Legacy compatibility - jetzt vollständiger Status
    isServerOnline,
    isBrowserOnline,
    isFullyOnline,
    lastOnlineTime,
    offlineDuration,
    hasBeenOnline,
    isInteractiveDisabled
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook zum Zugriff auf den Netzwerkstatus und verwandte Funktionen
 */
export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork muss innerhalb eines NetworkProviders verwendet werden');
  }
  return context;
} 