'use client';

import { useEffect } from 'react';

export default function Init() {
  useEffect(() => {
    fetch('/api/init')
      .then(response => {
        if (!response.ok) {
          console.error('Initialisierung fehlgeschlagen');
        }
      })
      .catch(error => {
        console.error('Fehler bei der Initialisierung:', error);
      });
  }, []);

  return null;
} 