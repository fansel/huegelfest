'use client';

import React, { ReactNode } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';

interface PullToRefreshWrapperProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefreshWrapper({
  children,
  onRefresh,
  enabled = true,
  threshold = 80,
  className = '',
}: PullToRefreshWrapperProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  
  // Pull-to-Refresh nur auf mobilen Geräten aktivieren
  const { isRefreshing, pullDistance, isThresholdReached, bindProps } = usePullToRefresh({
    onRefresh,
    enabled: enabled && isMobile,
    threshold,
  });

  // Nicht mobil = kein Pull-to-Refresh
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const pullProgress = Math.min(1, pullDistance / threshold);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : `translateY(${pullDistance}px)`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
      {...bindProps}
    >
      {/* Pull-to-Refresh Indikator - Dezent über Logo positioniert */}
      {showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            transform: `translateY(-${Math.min(pullDistance, threshold)}px)`,
            opacity: Math.min(0.9, pullProgress * 1.8), // Etwas sichtbarer
            paddingTop: '20px', // Direkt über dem Logo-Bereich
          }}
        >
          {/* Minimaler, dezenter Indikator mit besserer Sichtbarkeit */}
          <div className="bg-white/15 backdrop-blur-md rounded-full shadow-lg p-2.5 border border-white/30">
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-white animate-spin" />
            ) : isThresholdReached ? (
              <Check className="h-5 w-5 text-green-300" />
            ) : (
              <ArrowDown 
                className="h-5 w-5 text-white/80 transition-transform duration-200"
                style={{
                  transform: `rotate(${pullProgress * 180}deg)`,
                }}
              />
            )}
          </div>
          
          {/* Dezenter Text nur bei threshold erreicht */}
          {(isRefreshing || isThresholdReached) && (
            <div className="mt-2 text-sm font-medium text-white bg-white/15 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
            {isRefreshing 
              ? 'Aktualisiert...'
                : 'Loslassen'
            }
          </div>
          )}
        </div>
      )}

      {/* Eigentlicher Inhalt */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
} 