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
import { useAppLoading } from '@/shared/hooks/useAppLoading';
import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

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
  
  // App Loading State
  const { isLoading, isInitialLoad, loadingProgress, error } = useAppLoading({
    minDisplayTime: 3000, // Mindestens 3s anzeigen (vorher 1.2s)
    maxDisplayTime: 6000, // Maximal 6s warten (vorher 4s)
    dependsOnNetwork: true
  });

  const isMobileLayout = deviceType === 'mobile';

  // Hydration-Fix: MusicNote erst nach Mount anzeigen
  const [hasMounted, setHasMounted] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  
  useEffect(() => setHasMounted(true), []);

  // Markiere App als bereit für Loading-Check
  useEffect(() => {
    if (hasMounted && timelineData?.days && !document.querySelector('[data-app-ready]')) {
      const marker = document.createElement('div');
      marker.setAttribute('data-app-ready', 'true');
      marker.style.display = 'none';
      document.body.appendChild(marker);
    }
  }, [hasMounted, timelineData]);

  // NEU: Handler für Push-Subscription Änderungen
  const handlePushSubscriptionChange = (isSubscribed: boolean) => {
    // Zusätzliche Aktionen bei Subscription-Änderung falls nötig
    // Z.B. State Updates, Analytics, etc.
    console.log('Push subscription changed:', isSubscribed);
  };

  // Splash Screen Handler
  const handleSplashComplete = () => {
    setSplashComplete(true);
  };

  // Zeige Splash Screen während Initial Load
  if (isLoading || !splashComplete) {
    return (
      <SplashScreen 
        isVisible={isLoading} 
        onComplete={handleSplashComplete}
        progress={loadingProgress}
        error={error}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
      <InstallPrompt />
      <OfflineIndicator />
      <AutoPushPrompt onSubscriptionChange={handlePushSubscriptionChange} />
      {showStarfield && <Starfield />}
      {hasMounted && showMusicNote && mode !== 'admin' && isOnline && (
        <div className="fixed top-6 left-2 z-[9999] select-none">
          <MusicNote />
        </div>
      )}

      {activeTab !== 'signup' && (
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <div className="flex items-center justify-center w-full">
            <Image src="/logo.svg" alt="Hügelfest Logo" width={48} height={48} />
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
