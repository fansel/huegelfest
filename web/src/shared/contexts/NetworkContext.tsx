'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

interface NetworkContextType {
  isOnline: boolean;
  lastOnlineTime: number | null;
  offlineDuration: number;
  hasBeenOnline: boolean;
  isInteractiveDisabled: (actionType: 'write' | 'update' | 'delete' | 'read') => boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

/**
 * Provider für Netzwerk-Status und offline-bezogene Funktionen
 */
export function NetworkProvider({ children }: { children: ReactNode }) {
  const isOnline = useNetworkStatus();
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  const [hasBeenOnline, setHasBeenOnline] = useState(isOnline);
  const [offlineDuration, setOfflineDuration] = useState(0);
  
  // Letzten Online-Zeitpunkt tracken
  useEffect(() => {
    if (isOnline) {
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
  }, [isOnline, lastOnlineTime]);

  // Initiale Zeit setzen wenn online
  useEffect(() => {
    if (isOnline && lastOnlineTime === null) {
      setLastOnlineTime(Date.now());
      setHasBeenOnline(true);
    }
  }, [isOnline, lastOnlineTime]);

  /**
   * Prüft ob eine Interaktion basierend auf Netzwerkstatus deaktiviert werden sollte
   */
  const isInteractiveDisabled = (actionType: 'write' | 'update' | 'delete' | 'read'): boolean => {
    // Wenn online, alles erlauben
    if (isOnline) return false;
    
    // Im Offline-Modus:
    switch (actionType) {
      // Schreiboperationen immer verbieten im Offline-Modus
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
    isOnline,
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