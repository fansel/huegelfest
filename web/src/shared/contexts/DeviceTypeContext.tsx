'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export type DeviceType = 'mobile' | 'desktop';

interface DeviceTypeContextProps {
  deviceType: DeviceType;
}

const DeviceTypeContext = createContext<DeviceTypeContextProps | undefined>(undefined);

interface DeviceTypeProviderClientProps {
  deviceType: DeviceType;
  children: ReactNode;
}

/**
 * DeviceTypeProviderClient stellt den deviceType ("mobile" | "desktop") global zur Verfügung.
 * Im Layout als Wrapper um die App verwenden:
 * <DeviceTypeProviderClient deviceType={deviceType}>{children}</DeviceTypeProviderClient>
 */
export const DeviceTypeProviderClient: React.FC<DeviceTypeProviderClientProps> = ({ deviceType, children }) => {
  return (
    <DeviceTypeContext.Provider value={{ deviceType }}>
      {children}
    </DeviceTypeContext.Provider>
  );
};

/**
 * useDeviceType gibt den aktuellen deviceType zurück.
 * Beispiel:
 *   const { deviceType } = useDeviceType();
 */
export function useDeviceType(): DeviceTypeContextProps {
  const context = useContext(DeviceTypeContext);
  if (!context) {
    throw new Error('useDeviceType must be used within a DeviceTypeProviderClient');
  }
  return context;
} 