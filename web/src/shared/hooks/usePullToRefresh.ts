import { useState, useEffect, useCallback, useRef } from 'react';
import { TouchEventHandler } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Minimum distance to trigger refresh
  enabled?: boolean;
  cooldownMs?: number; // Cooldown time after refresh
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  isThresholdReached: boolean;
  bindProps: {
    onTouchStart: TouchEventHandler<HTMLDivElement>;
    onTouchMove: TouchEventHandler<HTMLDivElement>;
    onTouchEnd: TouchEventHandler<HTMLDivElement>;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
  cooldownMs = 1000,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isThresholdReached, setIsThresholdReached] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  const isOnline = useNetworkStatus();
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const hasTriggeredRefreshRef = useRef(false);

  const canRefresh = enabled && isOnline && !isRefreshing;

  const handleTouchStart: TouchEventHandler<HTMLDivElement> = useCallback((e) => {
    if (!canRefresh) return;
    
    // Nur starten wenn am oberen Rand des Containers gescrollt
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) return;
    
    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
    hasTriggeredRefreshRef.current = false;
  }, [canRefresh]);

  const handleTouchMove: TouchEventHandler<HTMLDivElement> = useCallback((e) => {
    if (!canRefresh || !isPullingRef.current || startYRef.current === null) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    
    // Nur ziehen wenn am oberen Rand
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      setIsThresholdReached(false);
      return;
    }

    // Elastische Widerstand: Langsamere Bewegung nach Threshold
    const elasticDistance = distance > threshold 
      ? threshold + (distance - threshold) * 0.4 
      : distance;

    setPullDistance(elasticDistance);
    setIsThresholdReached(distance >= threshold);

    // Verhindere Standard-Scroll wenn wir ziehen
    if (distance > 10) {
      e.preventDefault();
    }
  }, [canRefresh, threshold]);

  const handleTouchEnd: TouchEventHandler<HTMLDivElement> = useCallback(async () => {
    if (!canRefresh || !isPullingRef.current) return;

    isPullingRef.current = false;
    
    if (pullDistance >= threshold && !hasTriggeredRefreshRef.current) {
      hasTriggeredRefreshRef.current = true;
      
      // Prüfe Cooldown
      const now = Date.now();
      if (now - lastRefreshTime < cooldownMs) {
        setPullDistance(0);
        setIsThresholdReached(false);
        return;
      }

      setIsRefreshing(true);
      setLastRefreshTime(now);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Fehler beim Aktualisieren:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsThresholdReached(false);
        }, 500); // Kurze Verzögerung für bessere UX
      }
    } else {
      // Animation zurück zur Ausgangsposition
      setPullDistance(0);
      setIsThresholdReached(false);
    }

    startYRef.current = null;
  }, [canRefresh, pullDistance, threshold, onRefresh, lastRefreshTime, cooldownMs]);

  // Reset states wenn disabled
  useEffect(() => {
    if (!enabled || !isOnline) {
      setPullDistance(0);
      setIsThresholdReached(false);
      isPullingRef.current = false;
      startYRef.current = null;
    }
  }, [enabled, isOnline]);

  return {
    isRefreshing,
    pullDistance,
    isThresholdReached,
    bindProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
} 