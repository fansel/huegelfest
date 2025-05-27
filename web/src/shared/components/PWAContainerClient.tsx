'use client';

import MainContent from './MainContent';
import BottomBar from '@/features/pwa/Naviagation';
import dynamic from 'next/dynamic';
import MusicNote from '@/features/music/components/MusicNote';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Image from 'next/image';
import { useUISettings } from '@/shared/contexts/UISettingsContext';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import React, { useState, useEffect } from 'react';

const Starfield = dynamic(() => import('./Starfield'), { ssr: false });
const OfflineIndicator = dynamic(() => import('./OfflineIndicator').then(mod => ({ default: mod.OfflineIndicator })), { ssr: false });
const InstallPrompt = dynamic(() => import("@/shared/components/ui/InstallPrompt").then(mod => ({ default: mod.InstallPrompt })), { ssr: false });
const AutoPushPrompt = dynamic(() => import('@/features/push/components/AutoPushPrompt'), { ssr: false });

interface PWAContainerClientProps {
  isAdmin: boolean;
  timelineData: {
    days: any[];
    categories: any[];
  };
  infoBoardData: {
    announcements: any[];
    reactionsMap: Record<string, any>;
    deviceId: string;
  };
  carpoolData: any[];
  packlistData: any[];
}

export default function PWAContainerClient({ isAdmin, timelineData, infoBoardData, carpoolData, packlistData }: PWAContainerClientProps) {
  const { mode, activeTab, adminActiveTab, handleAdminToggle, handleTabChange } = useNavigation(isAdmin);
  const { showStarfield, showMusicNote } = useUISettings();
  const { deviceType } = useDeviceContext();
  const isOnline = useNetworkStatus();

  const isMobileLayout = deviceType === 'mobile';

  // Hydration-Fix: MusicNote erst nach Mount anzeigen
   const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);

  // NEU: Handler für Push-Subscription Änderungen
  const handlePushSubscriptionChange = (isSubscribed: boolean) => {
    // Zusätzliche Aktionen bei Subscription-Änderung falls nötig
    // Z.B. State Updates, Analytics, etc.
    console.log('Push subscription changed:', isSubscribed);
  };

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
      <InstallPrompt />
      <OfflineIndicator />
      <AutoPushPrompt onSubscriptionChange={handlePushSubscriptionChange} />
      {showStarfield && <Starfield />}
      {hasMounted && showMusicNote && mode !== 'admin' && isOnline && (
        <div className="fixed top-2 right-2 z-[9999] select-none">
          <MusicNote />
        </div>
      )}

      {activeTab !== 'signup' && (
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <div className="flex items-center justify-center w-full">
            <Image src="/android-chrome-192x192.png" alt="Hügelfest Logo" width={48} height={48} />
          </div>
        </div>
      )}
      <main className="flex-1 pb-20 flex flex-col min-h-0">
        <MainContent
          mode={mode}
          activeTab={activeTab}
          adminActiveTab={adminActiveTab}
          handleTabChange={handleTabChange}
          timelineData={timelineData}
          infoBoardData={infoBoardData}
          carpoolData={carpoolData}
          packlistData={packlistData}
        />
      </main>
      <BottomBar
        mode={mode}
        activeTab={mode === 'admin' ? adminActiveTab : activeTab}
        onTabChange={handleTabChange}
        isAdminActive={mode === 'admin'}
        onAdminToggle={handleAdminToggle}
        showAdminButton={isAdmin}
      />
    </div>
  );
}
