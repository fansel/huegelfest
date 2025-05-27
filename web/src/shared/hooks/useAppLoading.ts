'use client';

import { useState, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface UseAppLoadingOptions {
  /**
   * Minimale Zeit, die der Splash-Screen angezeigt werden soll (in ms)
   * @default 1500
   */
  minDisplayTime?: number;
  
  /**
   * Maximale Zeit, nach der der Splash-Screen automatisch ausgeblendet wird (in ms)
   * @default 5000
   */
  maxDisplayTime?: number;
  
  /**
   * Ob der Loading-Zustand von der Netzwerkverbindung abhängt
   * @default true
   */
  dependsOnNetwork?: boolean;
}

interface AppLoadingState {
  isLoading: boolean;
  isInitialLoad: boolean;
  loadingProgress: number;
  error: string | null;
}

/**
 * Hook zur Verwaltung des App-Loading-Zustands
 * Berücksichtigt verschiedene Faktoren wie Hydration, Netzwerk und minimale Anzeigezeit
 */
export function useAppLoading(options: UseAppLoadingOptions = {}): AppLoadingState {
  const {
    minDisplayTime = 1500,
    maxDisplayTime = 5000,
    dependsOnNetwork = true
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [hasMounted, setHasMounted] = useState(false);
  const [criticalDataLoaded, setCriticalDataLoaded] = useState(false);
  
  const isOnline = useNetworkStatus();

  // Hydration Check
  useEffect(() => {
    setHasMounted(true);
    setLoadingProgress(20);
  }, []);

  // Kritische Daten Check
  useEffect(() => {
    if (!hasMounted) return;

    const checkCriticalData = async () => {
      try {
        // Prüfe ob kritische Daten verfügbar sind
        const hasTimelineData = typeof window !== 'undefined' && 
          window.localStorage.getItem('timeline-cache') !== null;
        
        const hasBasicData = typeof window !== 'undefined' && 
          document.querySelector('[data-app-ready]') !== null;

        // Prüfe ob SWR Cache bereits Daten hat
        const hasSWRData = typeof window !== 'undefined' && 
          (window as any).__SWR_CACHE__ && Object.keys((window as any).__SWR_CACHE__).length > 0;

        // Prüfe ob DOM bereit ist
        const isDOMReady = document.readyState === 'complete';

        if (hasTimelineData || hasBasicData || hasSWRData || isDOMReady || !dependsOnNetwork || !isOnline) {
          setCriticalDataLoaded(true);
          setLoadingProgress(prev => Math.max(prev, 60));
        }
      } catch (err) {
        console.warn('[useAppLoading] Fehler beim Prüfen kritischer Daten:', err);
        setCriticalDataLoaded(true); // Fallback: Lade trotzdem
        setLoadingProgress(prev => Math.max(prev, 60));
      }
    };

    const timer = setTimeout(checkCriticalData, 300);
    return () => clearTimeout(timer);
  }, [hasMounted, isOnline, dependsOnNetwork]);

  // Loading Logic
  useEffect(() => {
    if (!hasMounted) return;

    const checkLoadingComplete = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Bedingungen für Loading-Abschluss
      const minTimeReached = elapsed >= minDisplayTime;
      const maxTimeReached = elapsed >= maxDisplayTime;
      const dataReady = criticalDataLoaded;
      const networkReady = !dependsOnNetwork || isOnline;
      
      // Progress Update
      let progress = 20; // Base für Hydration
      if (networkReady) progress += 20;
      if (dataReady) progress += 40;
      if (minTimeReached) progress += 20;
      
      setLoadingProgress(Math.min(progress, 100));
      
      // Loading beenden wenn alle Bedingungen erfüllt sind oder max Zeit erreicht
      if ((minTimeReached && dataReady && networkReady) || maxTimeReached) {
        setLoadingProgress(100);
        
        // Kurze Verzögerung für smooth transition
        setTimeout(() => {
          setIsLoading(false);
          setIsInitialLoad(false);
        }, 200);
        
        return true;
      }
      
      return false;
    };

    // Initial check
    if (checkLoadingComplete()) return;

    // Polling für Loading-Status
    const interval = setInterval(() => {
      if (checkLoadingComplete()) {
        clearInterval(interval);
      }
    }, 100);

    // Fallback: Nach maxDisplayTime definitiv beenden
    const fallbackTimer = setTimeout(() => {
      console.warn('[useAppLoading] Fallback: Loading nach maxDisplayTime beendet');
      setError('Loading dauerte länger als erwartet');
      setLoadingProgress(100);
      setIsLoading(false);
      setIsInitialLoad(false);
      clearInterval(interval);
    }, maxDisplayTime);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [hasMounted, criticalDataLoaded, isOnline, dependsOnNetwork, minDisplayTime, maxDisplayTime, startTime]);

  // Network Error Handling
  useEffect(() => {
    if (dependsOnNetwork && !isOnline && hasMounted) {
      const timer = setTimeout(() => {
        setError('Keine Internetverbindung');
        // Trotzdem laden, aber mit Warnung
        setCriticalDataLoaded(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else if (isOnline && error === 'Keine Internetverbindung') {
      setError(null);
    }
  }, [isOnline, dependsOnNetwork, hasMounted, error]);

  return {
    isLoading,
    isInitialLoad,
    loadingProgress,
    error
  };
} 