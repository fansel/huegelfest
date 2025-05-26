'use client';

import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Wifi, WifiOff, Clock, Heart, Calendar, Users, MessageSquare, Upload } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const isOnline = useNetworkStatus();
  const [isMounted, setIsMounted] = useState(false);

  // Erst nach Mount anzeigen (Hydration-safe)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Während SSR und vor Mount: Nichts anzeigen
  if (!isMounted) {
    return null;
  }

  // Nach Mount: Nur anzeigen wenn offline oder showDetails=true
  if (isOnline && !showDetails) return null;

  const offlineFeatures = [
    { icon: Heart, label: 'Favoriten', available: true },
    { icon: Calendar, label: 'Timeline (letzter Stand)', available: true },
    { icon: MessageSquare, label: 'Ankündigungen (letzter Stand)', available: true },
    { icon: Clock, label: 'Lokale Daten', available: true },
  ];

  const onlineOnlyFeatures = [
    { icon: Upload, label: 'Event einreichen', available: isOnline },
    { icon: Users, label: 'Live-Updates', available: isOnline },
    { icon: MessageSquare, label: 'Neue Ankündigungen', available: isOnline },
    { icon: Calendar, label: 'Aktuelle Timeline', available: isOnline },
  ];

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
        isOnline 
          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
      } ${className}`}>
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isOnline ? 'Online' : 'Offline - Lokale Daten verfügbar'}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isOnline 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-orange-500/10 border-orange-500/30'
    } ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {isOnline ? <Wifi className="text-green-400" size={20} /> : <WifiOff className="text-orange-400" size={20} />}
        <h3 className="font-semibold">
          {isOnline ? 'Online-Modus' : 'Offline-Modus'}
        </h3>
      </div>

      {!isOnline && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-green-400 mb-2">✅ Verfügbar offline:</h4>
          <div className="grid grid-cols-2 gap-2">
            {offlineFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-green-300">
                <feature.icon size={14} />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className={`text-sm font-medium mb-2 ${
          isOnline ? 'text-green-400' : 'text-orange-400'
        }`}>
          {isOnline ? '🌐 Online-Features aktiv:' : '⚠️ Benötigt Internet:'}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {onlineOnlyFeatures.map((feature, index) => (
            <div key={index} className={`flex items-center gap-2 text-sm ${
              feature.available ? 'text-green-300' : 'text-gray-400'
            }`}>
              <feature.icon size={14} />
              <span className={feature.available ? '' : 'line-through'}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isOnline && (
        <div className="mt-3 text-xs text-orange-300/80">
          Die App nutzt gespeicherte Daten. Verbinde dich für Updates.
        </div>
      )}
    </div>
  );
}; 