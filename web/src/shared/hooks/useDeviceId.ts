import { useEffect, useState } from 'react';

/**
 * Generiert eine 6-stellige zufällige Device-ID mit A-Z 0-9
 */
export function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gibt die deviceId zurück oder erzeugt sie, falls sie noch nicht existiert.
 * Nur im Client verwenden! (window !== undefined)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem('deviceId', id);
  }
  return id;
}

/**
 * React-Hook, der die deviceId liefert (oder erzeugt, falls nicht vorhanden).
 * Gibt null zurück, solange sie noch nicht im Client geladen ist.
 */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  return deviceId;
} 

