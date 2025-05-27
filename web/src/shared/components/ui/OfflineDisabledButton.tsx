'use client';

import React, { ReactNode } from 'react';
import { useNetwork } from '@/shared/contexts/NetworkContext';
import { WifiOff } from 'lucide-react';

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
 * Zeigt ein Offline-Icon und verhindert Interaktionen.
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
  const { isOnline, isInteractiveDisabled } = useNetwork();
  const isOfflineDisabled = isInteractiveDisabled(actionType);
  const finalDisabled = disabled || isOfflineDisabled;
  
  const handleClick = () => {
    if (finalDisabled) return;
    onClick?.();
  };
  
  return (
    <div 
      className={`relative ${className} ${finalDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleClick}
      title={title || (isOfflineDisabled ? 'Im Offline-Modus nicht verfügbar' : undefined)}
      aria-disabled={finalDisabled}
    >
      {children}
      
      {isOfflineDisabled && showIcon && (
        <div className="absolute top-1 right-1 bg-orange-500/80 p-1 rounded-full">
          <WifiOff size={12} className="text-white" />
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
  const { isInteractiveDisabled } = useNetwork();
  const isDisabled = isInteractiveDisabled('write');
  
  if (!isDisabled) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
          <div className="bg-orange-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            <WifiOff size={16} />
            <span>Offline - Keine Änderungen möglich</span>
          </div>
        </div>
      )}
    </div>
  );
} 