'use client';

import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { useEffect, useState } from 'react';

export const NetworkStatusBanner = () => {
  const { isOnline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(isOnline);

  useEffect(() => {
    // Nur Banner anzeigen, wenn sich der Status ändert
    if (previousStatus !== isOnline) {
      setShowBanner(true);
      setPreviousStatus(isOnline);

      // Banner nach 3 Sekunden ausblenden
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, previousStatus]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`w-full py-2 px-4 text-center font-medium ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        {isOnline ? 'Du bist wieder online' : 'Du bist offline'}
      </div>
    </div>
  );
}; 