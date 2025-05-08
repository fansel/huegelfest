'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Megaphone, Settings as SettingsIcon, Heart, Shield, BookOpen } from 'lucide-react';
import Timeline from '@/features/timeline/components/Timeline';
import InfoBoard from '@/features/infoboard/components/InfoBoard';
import Anreise from '@/features/anreise/components/page';
import Admin from '@/features/admin/admin/page';
import { Starfield } from './Starfield';
import { Footer } from './Footer';
import PushNotificationSettings from '@/features/settings/components/PushNotificationSettings';
import Settings from '@/features/settings/components/Settings';
import Image from 'next/image';
import { useAuth } from '@/features/auth/AuthContext';
import StampCardPage from '@/features/stampcard/page';

type View = 'home' | 'anreise' | 'infoboard' | 'settings' | 'admin' | 'favorites' | 'stampcard';

const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export default function PWAContainer({ children }: React.PropsWithChildren) {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isPWA, setIsPWA] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [showStarfield, setShowStarfield] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);
  const { isAdmin } = useAuth();
  const [betaStampcard, setBetaStampcard] = useState(() => typeof window !== 'undefined' && localStorage.getItem('beta_stampcard') === 'true');

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

  useEffect(() => {
    const handler = () => setBetaStampcard(localStorage.getItem('beta_stampcard') === 'true');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Navigation
  const baseNavItems = [
    { id: 'home', icon: Calendar, label: 'Timeline' },
    { id: 'anreise', icon: MapPin, label: 'Anreise' },
    { id: 'infoboard', icon: Megaphone, label: 'News' },
    { id: 'favorites', icon: Heart, label: 'Favoriten' },
    ...(betaStampcard ? [{ id: 'stampcard', icon: BookOpen, label: 'Stempel' }] : []),
    { id: 'settings', icon: SettingsIcon, label: 'Einstellungen' }
  ];
  const navItems = isAdmin
    ? [
        ...baseNavItems,
        { id: 'admin', icon: Shield, label: 'Admin' },
      ]
    : baseNavItems;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      setIsNavVisible(false);
    } else if (diff < -50) {
      setIsNavVisible(true);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <Timeline allowClipboard={isDesktopDevice} />;
      case 'anreise':
        return <Anreise allowClipboard={isDesktopDevice} />;
      case 'infoboard':
        return <InfoBoard isPWA={isPWA} allowClipboard={isDesktopDevice} />;
      case 'favorites':
        return <Timeline showFavoritesOnly={true} allowClipboard={isDesktopDevice} />;
      case 'settings':
        return <Settings showStarfield={showStarfield} onToggleStarfield={() => setShowStarfield(!showStarfield)} />;
      case 'admin':
        return isAdmin ? <Admin /> : null;
      case 'stampcard':
        return betaStampcard ? <StampCardPage /> : null;
      default:
        return null;
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
      {showStarfield && <Starfield />}
      <div className="flex flex-col items-center justify-center gap-2 pt-4">
        <div className="flex items-center justify-center w-full">
          <Image src="/android-chrome-192x192.png" alt="Hügelfest Logo" width={48} height={48} />
        </div>
      </div>
      <main className="flex-1 pb-20" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        {renderContent()}
        {children}
      </main>
      <nav className={`fixed bottom-0 left-0 right-0 ${showStarfield ? 'bg-[#460b6c]/90' : 'bg-[#460b6c]'} backdrop-blur-md border-t border-[#ff9900]/20 z-50 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-between items-center h-16 px-2 sm:px-4">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as View)}
              className={`flex items-center justify-center min-w-[60px] transition-all duration-200 ${currentView === id ? 'text-[#ff9900] scale-110' : 'text-[#ff9900]/60 hover:text-[#ff9900]'}`}
            >
              <div className={`p-2 rounded-full transition-colors duration-200 ${currentView === id ? 'bg-[#ff9900]/20' : 'bg-transparent'}`}> <Icon size={24} /> </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
} 