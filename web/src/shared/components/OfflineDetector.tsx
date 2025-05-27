'use client';

import { useEffect, useRef } from 'react';
import { useNetwork } from '@/shared/contexts/NetworkContext';

/**
 * Komponente zur stillen Offline-Erkennung ohne Toast-Benachrichtigungen.
 * Wird einmal in der App eingebunden und trackt nur den Status.
 */
export function OfflineDetector() {
  const { isOnline } = useNetwork();
  const prevOnlineRef = useRef<boolean | null>(null);
  
  // Status tracken ohne Benachrichtigungen
  useEffect(() => {
    // Ersten Aufruf ignorieren (nach Initialisierung)
    if (prevOnlineRef.current === null) {
      prevOnlineRef.current = isOnline;
      return;
    }
    
    // Nur bei Statusänderung loggen (keine Toasts)
    if (prevOnlineRef.current !== isOnline) {
      if (isOnline) {
        console.log('[Network] Wieder online - Daten werden aktualisiert');
        // Auto-Reload von Daten wird durch SWR übernommen
      } else {
        console.log('[Network] Offline - Lokale Daten werden verwendet');
      }
    }
    
    // Status für den nächsten Vergleich speichern
    prevOnlineRef.current = isOnline;
  }, [isOnline]);
  
  // Reine Logik-Komponente, keine UI
  return null;
} 