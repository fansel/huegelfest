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
import { useAuth } from '@/features/auth/AuthContext';
import { TemporarySessionBanner } from './TemporarySessionBanner';

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
  } | null;
}

const DEBUG = false;

export default function PWAContainerClient({ isAdmin, timelineData, infoBoardData, carpoolData, packlistData, adminData: initialAdminData }: PWAContainerClientProps) {
  const { mode, activeTab, adminActiveTab, handleAdminToggle, handleTabChange, showAdminButton } = useNavigation(isAdmin);
  const { showStarfield, showMusicNote } = useUISettings();
  const { deviceType } = useDeviceContext();
  const isOnline = useNetworkStatus();
  const { isLoading, loadingProgress, error } = useAppLoading({
    minDisplayTime: 3000,
    maxDisplayTime: 6000,
    dependsOnNetwork: true
  });
  const { isTemporarySession } = useAuth();
  
  const [adminData, setAdminData] = useState(initialAdminData);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  
  const isMobileLayout = deviceType === 'mobile';

  const [hasMounted, setHasMounted] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  
  useEffect(() => setHasMounted(true), []);

  useEffect(() => {
    if (hasMounted && timelineData?.days && !document.querySelector('[data-app-ready]')) {
      const marker = document.createElement('div');
      marker.setAttribute('data-app-ready', 'true');
      marker.style.display = 'none';
      document.body.appendChild(marker);
    }
  }, [hasMounted, timelineData]);

  const loadFreshAdminData = useCallback(async () => {
    if (!isOnline) return;
    
    setLoadingAdminData(true);
    try {
      if (DEBUG) {
        console.log('[PWA] Lade frische Admin-Daten...');
      }
      
      const [announcementsData, workingGroups, categories, pendingEvents, tracks, groupsData, activitiesData] = await Promise.all([
        getAllAnnouncementsAction(),
        getWorkingGroupsArrayAction(), 
        getCategoriesAction(),
        getPendingEventsAction(),
        getAllTracks(),
        fetchGroupsData(),
        fetchActivitiesData()
      ]);

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
      if (DEBUG) {
        console.log('[PWA] Admin-Daten erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('[PWA] Fehler beim Laden der Admin-Daten:', error);
      // Keep existing data on error
    } finally {
      setLoadingAdminData(false);
    }
  }, [isOnline]);

  useEffect(() => {
    if (mode === 'admin' && !adminData) {
      loadFreshAdminData();
    }
  }, [mode, adminData, loadFreshAdminData]);

  const handlePushSubscriptionChange = (isSubscribed: boolean) => {
    if (DEBUG) {
      console.log('[PWA] Push subscription changed:', isSubscribed);
    }
  };

  const handleSplashComplete = () => {
    setSplashComplete(true);
  };

  const handleGlobalRefresh = useCallback(async () => {
    await mutate(() => true);
    
    if (mode === 'admin' && isAdmin) {
      await loadFreshAdminData();
    }
  }, [mode, isAdmin, loadFreshAdminData]);

  const handleAdminToggleWithRefresh = useCallback(() => {
    if (mode === 'admin') {
      handleAdminToggle();
    } else if (isAdmin) {
      handleAdminToggle();
      if (isOnline) {
        loadFreshAdminData();
      }
    }
  }, [mode, isAdmin, isOnline, handleAdminToggle, loadFreshAdminData]);

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
      <TemporarySessionBanner />
      <AutoPushPrompt onSubscriptionChange={handlePushSubscriptionChange} />
      {showStarfield && <Starfield />}
      {hasMounted && showMusicNote && mode !== 'admin' && activeTab !== 'signup' && isOnline && (
        <div className="fixed left-4 top-4 z-[9999] select-none">
          <MusicNote />
        </div>
      )}

      <div className={`flex flex-col ${!isMobileLayout ? 'pt-16' : ''} ${isTemporarySession ? 'pt-8' : ''}`}>
        {activeTab !== 'signup' && (
          <div className="flex flex-col items-center justify-center gap-2 pt-4">
            <div className="flex items-center justify-center w-full">
              <Image 
                src="/logo.svg" 
                alt="Hügelfest Logo" 
                width={48} 
                height={48} 
              />
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
      </div>
      
      <BottomBar
        mode={mode}
        activeTab={mode === 'admin' ? adminActiveTab : activeTab}
        onTabChange={handleTabChange}
        isAdminActive={mode === 'admin'}
        onAdminToggle={handleAdminToggleWithRefresh}
        showAdminButton={showAdminButton}
      />
    </div>
  );
}
