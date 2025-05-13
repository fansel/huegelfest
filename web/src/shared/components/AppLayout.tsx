'use client';

import React from 'react';
import { usePWA } from '@/contexts/PWAContext';
import PWAContainer from './PWAContainer';
import dynamic from 'next/dynamic';

const MusicNote = dynamic(() => import('@/features/music/components/MusicNote'), { ssr: false });

interface AppLayoutProps {
  children: React.ReactNode;
  hideMusicNote?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, hideMusicNote }) => {
  const { isPWA } = usePWA();
  return isPWA ? (
    <PWAContainer />
  ) : (
    <>
      <main className="flex-grow pb-16 md:pb-0">{children}</main>
      {!hideMusicNote && <MusicNote />}
    </>
  );
};

export default AppLayout; 