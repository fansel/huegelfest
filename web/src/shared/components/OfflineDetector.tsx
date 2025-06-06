'use client';

import { useEffect, useRef } from 'react';
import { useNetwork } from '@/shared/contexts/NetworkContext';

const DEBUG = false;

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
        if (DEBUG) {
          console.log('[Network] Wieder online - Daten werden aktualisiert');
        }
      } else {
        if (DEBUG) {
          console.log('[Network] Offline - Lokale Daten werden verwendet');
        }
      }
    }
    
    // Status für den nächsten Vergleich speichern
    prevOnlineRef.current = isOnline;
  }, [isOnline]);
  
  // Reine Logik-Komponente, keine UI
  return null;
} 