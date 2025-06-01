'use client';

import React, { useEffect, useState } from 'react';
import { useServerStatus } from '@/shared/hooks/useServerStatus';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { WifiOff, ServerCrash } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * Server-Offline-Indikator fest fixiert unter der Navbar
 * Am Desktop: unter der Top-Navbar
 * Am Handy: unter der Bottom-Navbar
 * Lila Design, sehr dezent aber fest sichtbar
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '' 
}) => {
  const { isServerOnline, isBrowserOnline, isFullyOnline } = useServerStatus();
  const { deviceType } = useDeviceContext();
  const [isMounted, setIsMounted] = useState(false);
  
  const isMobileLayout = deviceType === 'mobile';

  // Erst nach Mount anzeigen (Hydration-safe)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Während SSR und vor Mount: Nichts anzeigen
  if (!isMounted || isFullyOnline) return null;

  // Bestimme den genauen Offline-Status
  const isClientOffline = !isBrowserOnline;
  const isServerOffline = isBrowserOnline && !isServerOnline;

  // Positionierung je nach Device-Type
  const positionClasses = isMobileLayout 
    ? 'bottom-16' // Am Handy: über der Bottom-Navbar (die ist 64px hoch)
    : 'top-16';   // Am Desktop: unter der Top-Navbar (die ist 64px hoch)

  return (
    <div className={`fixed left-0 right-0 z-[9999] bg-[#460b6c]/95 text-white/95 text-center py-2 px-4 text-xs border-[#ff9900]/30 shadow-lg ${positionClasses} ${isMobileLayout ? 'border-t' : 'border-b'} ${className}`}>
      <div className="flex items-center justify-center gap-1.5">
        {isClientOffline ? (
          <>
            <WifiOff size={12} />
            <span className="font-medium">Du bist offline</span>
          </>
        ) : isServerOffline ? (
          <>
            <ServerCrash size={12} />
            <span className="font-medium">Server ist offline</span>
          </>
        ) : (
          <>
            <WifiOff size={12} />
            <span className="font-medium">Du bist offline</span>
          </>
        )}
      </div>
    </div>
  );
}; 