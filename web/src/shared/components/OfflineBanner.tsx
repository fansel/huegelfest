'use client';
import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Zeigt einen dezenten Banner über der Bottom Bar an, wenn der User offline ist.
 * Wird am besten im Layout oder PWAContainer eingebunden.
 */
export const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [isMounted, setIsMounted] = useState(false);

  // Erst nach Mount anzeigen (Hydration-safe)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Während SSR und vor Mount: Nichts anzeigen
  if (!isMounted || isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '72px', // Höhe der BottomBar + Abstand
        left: 0,
        right: 0,
        background: '#460b6c',
        color: '#ff9900',
        textAlign: 'center',
        zIndex: 9998, // Unter der BottomBar
        padding: '4px 0',
        fontSize: '0.75rem',
        opacity: 0.9,
        borderTop: '1px solid rgba(255,153,0,0.2)',
      }}
      role="status"
      aria-live="polite"
    >
      Du bist offline
    </div>
  );
};

export default OfflineBanner;