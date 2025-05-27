'use client';

import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * Minimaler Offline-Indikator direkt über der Bottom-Navbar
 * Lila Design, sehr dezent und klein
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '' 
}) => {
  const isOnline = useNetworkStatus();
  const [isMounted, setIsMounted] = useState(false);

  // Erst nach Mount anzeigen (Hydration-safe)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Während SSR und vor Mount: Nichts anzeigen
  if (!isMounted || isOnline) return null;

  return (
    <div className={`fixed bottom-16 left-0 right-0 z-[9998] bg-[#460b6c]/90 text-white/90 text-center py-1 px-4 text-xs ${className}`}>
      <div className="flex items-center justify-center gap-1">
        <WifiOff size={10} />
        <span>Du bist offline</span>
      </div>
    </div>
  );
}; 