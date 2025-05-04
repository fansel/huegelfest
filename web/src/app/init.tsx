'use client';

import { useEffect } from 'react';

export default function Init() {
  useEffect(() => {
    console.log('[Init] Starte Initialisierung...');
    
    fetch('/api/init')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          console.error('[Init] Initialisierung fehlgeschlagen:', data);
        } else {
          console.log('[Init] Initialisierung erfolgreich:', data);
        }
      })
      .catch(error => {
        console.error('[Init] Fehler bei der Initialisierung:', error);
      });
  }, []);

  return null;
} 