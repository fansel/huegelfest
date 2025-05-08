'use client';

import React from 'react';
import { usePWA } from '@/contexts/PWAContext';
import PWAContainer from './PWAContainer';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isPWA } = usePWA();
  return isPWA ? <PWAContainer /> : <><main className="flex-grow pb-16 md:pb-0">{children}</main></>;
};

export default AppLayout; 