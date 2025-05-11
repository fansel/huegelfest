'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Megaphone, Settings as SettingsIcon, Heart, Shield } from 'lucide-react';
import Timeline from '@/features/timeline/components/Timeline';
import InfoBoard from '@/features/infoboard/components/InfoBoard';
import Anreise from '@/features/anreise/components/page';
import { Starfield } from './Starfield';
import { Footer } from './Footer';
import PushNotificationSettings from '@/features/settings/components/PushNotificationSettings';
import Settings from '@/features/settings/components/Settings';
import Image from 'next/image';
import { useAuth } from '@/features/auth/AuthContext';
import BottomBar from '@/features/pwa/BottomBar';
import AdminDashboardWrapper from '@/features/admin/dashboard/AdminDashboardWrapper';
import { FavoritesList } from '@/features/favorites/components/FavoritesList';


type View =
  | 'home'
  | 'anreise'
  | 'infoboard'
  | 'settings'
  | 'admin'
  | 'favorites'
  | 'announcements'
  | 'groups'
  | 'timeline'
  | 'admin-settings';

type TabKey = 'announcements' | 'groups' | 'timeline';

const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function PWAContainer({ children }: React.PropsWithChildren) {
  const [activeTab, setActiveTab] = useState<View>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<TabKey>('announcements');
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [showStarfield, setShowStarfield] = useState(true);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    setIsDesktopDevice(isDesktop());
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateIsPWA = () => setIsPWA(mediaQuery.matches);
    updateIsPWA();
    mediaQuery.addEventListener('change', updateIsPWA);
    return () => {
      mediaQuery.removeEventListener('change', updateIsPWA);
    };
  }, []);

  // Admin-Modus umschalten
  const handleAdminToggle = () => {
    if (isAdminActive) {
      setMode('user');
      setIsAdminActive(false);
      setActiveTab('home');
    } else if (isAdmin) {
      setMode('admin');
      setIsAdminActive(true);
      setAdminActiveTab('announcements');
    }
  };

  // Tab-Wechsel
  const handleUserTabChange = (tab: string) => setActiveTab(tab as View);
  const handleAdminTabChange = (tab: string) => setAdminActiveTab(tab as TabKey);

  // Content je nach Modus und Tab
  const renderContent = () => {
    if (mode === 'admin') {
      return <AdminDashboardWrapper activeAdminTab={adminActiveTab} />;
    } else {
      switch (activeTab) {
        case 'home':
          return <Timeline allowClipboard={isDesktopDevice} />;
        case 'anreise':
          return <Anreise allowClipboard={isDesktopDevice} />;
        case 'infoboard':
          return <InfoBoard isPWA={isPWA} allowClipboard={isDesktopDevice} />;
        case 'favorites':
          return <FavoritesList />;
        case 'settings':
          return <Settings showStarfield={showStarfield} onToggleStarfield={() => setShowStarfield(!showStarfield)} />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
      {showStarfield && <Starfield />}
      <div className="flex flex-col items-center justify-center gap-2 pt-4">
        <div className="flex items-center justify-center w-full">
          <Image src="/android-chrome-192x192.png" alt="Hügelfest Logo" width={48} height={48} />
        </div>
      </div>
      <main className="flex-1 pb-20">
        {renderContent()}
        {children}
      </main>
      <BottomBar
        mode={mode}
        activeTab={mode === 'admin' ? adminActiveTab : activeTab}
        onTabChange={mode === 'admin' ? handleAdminTabChange : handleUserTabChange}
        isAdminActive={isAdminActive}
        onAdminToggle={handleAdminToggle}
        showAdminButton={isAdmin}
      />
    </div>
  );
} 