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
import React, { useState, useEffect, useCallback } from 'react';
import SplashScreen from './SplashScreen';
import { mutate } from 'swr';
// Import admin data refresh functions
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getWorkingGroupsArrayAction } from '@/features/workingGroups/actions/getWorkingGroupColors';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { getPendingEventsAction } from '@/features/timeline/actions/getPendingEventsAction';
import { getAllTracks } from '@/features/music/actions/getAllTracks';
import { fetchGroupsData } from '@/features/admin/components/groups/actions/fetchGroupsData';
import { fetchActivitiesData } from '@/features/admin/components/activities/actions/fetchActivitiesData';

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
  adminData?: {
    announcements: any[];
    workingGroups: any[];
    categories: any[];
    pendingEvents: any[];
    tracks: any[];
    groupsData: any;
    activitiesData: any;
  };
}

export default function PWAContainerClient({ isAdmin, timelineData, infoBoardData, carpoolData, packlistData, adminData: initialAdminData }: PWAContainerClientProps) {
  const { mode, activeTab, adminActiveTab, handleAdminToggle, handleTabChange } = useNavigation(isAdmin);
  const { showStarfield, showMusicNote } = useUISettings();
  const { deviceType } = useDeviceContext();
  const isOnline = useNetworkStatus();
  
  // Admin data state - can be refreshed independently of SSR
  const [adminData, setAdminData] = useState(initialAdminData);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  
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

  // Load fresh admin data when entering admin mode
  const loadFreshAdminData = useCallback(async () => {
    if (!isAdmin || !isOnline) return;
    
    setLoadingAdminData(true);
    try {
      console.log('[PWA] Lade frische Admin-Daten...');
      
      const [announcementsData, workingGroups, categories, pendingEvents, tracks, groupsData, activitiesData] = await Promise.all([
        getAllAnnouncementsAction(),
        getWorkingGroupsArrayAction(), 
        getCategoriesAction(),
        getPendingEventsAction(),
        getAllTracks(),
        fetchGroupsData(),
        fetchActivitiesData()
      ]);

      // Map announcements with group info
      const announcements = announcementsData.map((a: any) => ({
        ...a,
        groupName: a.groupInfo?.name || '',
        groupColor: a.groupInfo?.color || '',
      }));

      const freshAdminData = {
        announcements,
        workingGroups,
        categories,
        pendingEvents,
        tracks,
        groupsData,
        activitiesData
      };
      
      setAdminData(freshAdminData);
      console.log('[PWA] Admin-Daten erfolgreich aktualisiert');
    } catch (error) {
      console.error('[PWA] Fehler beim Laden der Admin-Daten:', error);
      // Keep existing data on error
    } finally {
      setLoadingAdminData(false);
    }
  }, [isAdmin, isOnline]);

  // Load fresh admin data when entering admin mode
  useEffect(() => {
    if (mode === 'admin' && !adminData && isAdmin) {
      loadFreshAdminData();
    }
  }, [mode, adminData, isAdmin, loadFreshAdminData]);

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

  // Enhanced refresh function that also refreshes admin data if in admin mode
  const handleGlobalRefresh = useCallback(async () => {
    // Einfach: Alle SWR Caches auf einmal invalidieren
    await mutate(() => true);
    
    // If in admin mode, also refresh admin data
    if (mode === 'admin' && isAdmin) {
      await loadFreshAdminData();
    }
  }, [mode, isAdmin, loadFreshAdminData]);

  // Custom admin toggle that loads fresh data
  const handleAdminToggleWithRefresh = useCallback(() => {
    if (mode === 'admin') {
      // Leaving admin mode - use original toggle
      handleAdminToggle();
    } else if (isAdmin) {
      // Entering admin mode - load fresh data first
      handleAdminToggle(); // Switch mode first
      if (isOnline) {
        loadFreshAdminData(); // Then load fresh data
      }
    }
  }, [mode, isAdmin, isOnline, handleAdminToggle, loadFreshAdminData]);

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
      {hasMounted && showMusicNote && mode !== 'admin' && activeTab !== 'signup' && isOnline && (
        <div className="fixed left-4 top-4 z-[9999] select-none">
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
      
        <MainContent
          mode={mode}
          activeTab={activeTab}
          adminActiveTab={adminActiveTab}
          handleTabChange={handleTabChange}
          timelineData={timelineData}
          infoBoardData={infoBoardData}
          carpoolData={carpoolData}
          packlistData={packlistData}
          adminData={adminData}
          loadingAdminData={loadingAdminData}
        />    
      <BottomBar
        mode={mode}
        activeTab={mode === 'admin' ? adminActiveTab : activeTab}
        onTabChange={handleTabChange}
        isAdminActive={mode === 'admin'}
        onAdminToggle={handleAdminToggleWithRefresh}
        showAdminButton={isAdmin}
      />
    </div>
  );
}
