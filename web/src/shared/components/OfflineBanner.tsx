'use client';
import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Zeigt einen Minibanner an, wenn der User offline ist.
 * Wird am besten im Layout oder PWAContainer eingebunden.
 */
export const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#ff3333',
        color: '#fff',
        textAlign: 'center',
        zIndex: 9999,
        padding: '4px 0',
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
      role="status"
      aria-live="polite"
    >
      Du bist offline – Daten ggf. nicht aktuell
    </div>
  );
};

export default OfflineBanner; 