import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook zur Überwachung des Server-Status.
 * Gibt true zurück nur wenn der Server tatsächlich erreichbar ist.
 * Reagiert schnell auf Server-Ausfälle auch bei aktiver Internetverbindung.
 */
export function useServerStatus(): {
  isServerOnline: boolean;
  isBrowserOnline: boolean;
  isFullyOnline: boolean;
  forceCheck: () => Promise<void>;
} {
  const { isOnline, isServerOnline, isBrowserOnline, forceHealthCheck } = useNetworkStatus();
  
  return {
    isServerOnline,
    isBrowserOnline,
    isFullyOnline: isOnline, // Browser UND Server online
    forceCheck: forceHealthCheck
  };
}

/**
 * Vereinfachter Hook der nur den Server-Status zurückgibt.
 * Perfekt für UI-Components die wissen müssen ob Server verfügbar ist.
 */
export function useIsServerOnline(): boolean {
  const { isServerOnline } = useNetworkStatus();
  return isServerOnline;
} 