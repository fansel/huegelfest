import { useEffect, useState } from 'react';

/**
 * React-Hook zur Überwachung des Netzwerkstatus (online/offline).
 * SSR-safe: Startet mit null und zeigt dann den echten Status.
 */
export function useNetworkStatus(): boolean {
  // Starte mit null für SSR-Kompatibilität, dann echter Wert
  const [isOnline, setIsOnline] = useState<boolean>(true); // Default online für SSR
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Nach Hydration: Echten Navigator-Status setzen
    setIsOnline(navigator.onLine);
    setIsHydrated(true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Während SSR und vor Hydration: Immer online annehmen
  if (!isHydrated) {
    return true;
  }

  return isOnline;
} 