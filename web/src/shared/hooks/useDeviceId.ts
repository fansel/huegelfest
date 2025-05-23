import { useEffect, useState } from 'react';

/**
 * Gibt die deviceId zurück oder erzeugt sie, falls sie noch nicht existiert.
 * Nur im Client verwenden! (window !== undefined)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = btoa(`${navigator.userAgent}-${Date.now()}-${Math.random()}`);
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