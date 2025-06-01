'use client';

import React, { ReactNode } from 'react';
import { useNetwork } from '@/shared/contexts/NetworkContext';
import { WifiOff, ServerCrash } from 'lucide-react';

interface OfflineDisabledProps {
  children: ReactNode;
  actionType?: 'write' | 'update' | 'delete' | 'read';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  showIcon?: boolean;
  title?: string;
}

/**
 * Wrapper-Komponente die Inhalte automatisch im Offline-Modus deaktiviert.
 * Zeigt passende Icons für Browser- oder Server-Offline-Status.
 */
export function OfflineDisabled({
  children,
  actionType = 'write',
  className = '',
  onClick,
  disabled = false,
  showIcon = true,
  title
}: OfflineDisabledProps) {
  const { isFullyOnline, isBrowserOnline, isServerOnline, isInteractiveDisabled } = useNetwork();
  const isOfflineDisabled = isInteractiveDisabled(actionType);
  const finalDisabled = disabled || isOfflineDisabled;
  
  const handleClick = () => {
    if (finalDisabled) return;
    onClick?.();
  };
  
  // Bestimme das passende Icon und die Nachricht
  const getOfflineInfo = () => {
    if (isFullyOnline) return null;
    
    if (!isBrowserOnline) {
      return {
        icon: WifiOff,
        message: 'Keine Internetverbindung'
      };
    }
    
    if (!isServerOnline) {
      return {
        icon: ServerCrash,
        message: 'Server nicht erreichbar'
      };
    }
    
    return {
      icon: WifiOff,
      message: 'Im Offline-Modus nicht verfügbar'
    };
  };
  
  const offlineInfo = getOfflineInfo();
  const OfflineIcon = offlineInfo?.icon;
  
  return (
    <div 
      className={`relative ${className} ${finalDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleClick}
      title={title || offlineInfo?.message}
      aria-disabled={finalDisabled}
    >
      {children}
      
      {isOfflineDisabled && showIcon && OfflineIcon && (
        <div className="absolute top-1 right-1 bg-orange-500/80 p-1 rounded-full">
          <OfflineIcon size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

/**
 * Spezielle Komponente für Formulare und Eingabebereiche
 */
export function OfflineDisabledForm({
  children,
  className = '',
  showOverlay = true
}: {
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
}) {
  const { isFullyOnline, isBrowserOnline, isServerOnline, isInteractiveDisabled } = useNetwork();
  const isDisabled = isInteractiveDisabled('write');
  
  if (!isDisabled) {
    return <div className={className}>{children}</div>;
  }
  
  // Bestimme die passende Offline-Nachricht
  const getOfflineMessage = () => {
    if (!isBrowserOnline) {
      return 'Keine Internetverbindung - Keine Änderungen möglich';
    }
    
    if (!isServerOnline) {
      return 'Server nicht erreichbar - Keine Änderungen möglich';
    }
    
    return 'Offline - Keine Änderungen möglich';
  };
  
  const getOfflineIcon = () => {
    if (!isBrowserOnline) return WifiOff;
    if (!isServerOnline) return ServerCrash;
    return WifiOff;
  };
  
  const OfflineIcon = getOfflineIcon();
  
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
          <div className="bg-orange-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <OfflineIcon size={16} />
            <span>{getOfflineMessage()}</span>
          </div>
        </div>
      )}
    </div>
  );
} 