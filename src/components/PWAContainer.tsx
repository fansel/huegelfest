'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Megaphone, Settings as SettingsIcon, Heart, Shield } from 'lucide-react';
import Timeline from './Timeline';
import InfoBoard from './InfoBoard';
import Anreise from '../app/anreise/page';
import Admin from '../app/admin/page';
import Starfield from './Starfield';
import PushNotificationSettings from './PushNotificationSettings';
import Settings from './settings/Settings';
import MusicNote from './MusicNote';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

type View = 'home' | 'anreise' | 'infoboard' | 'settings' | 'admin' | 'favorites';

export default function PWAContainer() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isPWA, setIsPWA] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [showStarfield, setShowStarfield] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [isMusicActive, setIsMusicActive] = useState(false);
  const [isMusicVisible, setIsMusicVisible] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateIsPWA = () => setIsPWA(mediaQuery.matches);
    updateIsPWA();
    mediaQuery.addEventListener('change', updateIsPWA);

    // Prüfe Push-Unterstützung
    const checkPushSupport = async () => {
      const notificationsSupported = 'Notification' in window;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;

      if (notificationsSupported && serviceWorkerSupported && pushManagerSupported) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
          
          if (registration.active) {
            setPushSupported(true);
            
            const cookies = document.cookie.split(';');
            const hasAskedForPush = cookies.some(cookie => 
              cookie.trim().startsWith('pushAsked=') && 
              cookie.trim().split('=')[1] === 'true'
            );

            if (!hasAskedForPush) {
              setTimeout(() => {
                setShowPushDialog(true);
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Service Worker Fehler:', error);
        }
      }
    };

    checkPushSupport();

    return () => {
      mediaQuery.removeEventListener('change', updateIsPWA);
    };
  }, []);

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

  const toggleStarfield = () => {
    const newValue = !showStarfield;
    setShowStarfield(newValue);
    document.cookie = `showStarfield=${newValue}; path=/; max-age=31536000`;
  };

  const toggleAdmin = (value: boolean) => {
    setShowAdmin(value);
  };

  // Basis-Navigation
  const baseNavItems = [
    { id: 'home', icon: Calendar, label: 'Timeline' },
    { id: 'anreise', icon: MapPin, label: 'Anreise' },
    { id: 'infoboard', icon: Megaphone, label: 'News' },
    { id: 'favorites', icon: Heart, label: 'Favoriten' },
    { id: 'settings', icon: SettingsIcon, label: 'Einstellungen' }
  ];

  // Admin-Navigation nur hinzufügen, wenn authentifiziert
  const navItems = isAuthenticated ? [...baseNavItems, { id: 'admin', icon: Shield, label: 'Admin' }] : baseNavItems;

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Timeline />
          </div>
        );
      case 'anreise':
        return (
          <div className={`flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center ${!showStarfield ? 'bg-[#460b6c]' : ''}`}>
            <Anreise />
          </div>
        );
      case 'infoboard':
        return (
          <div className={`flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center ${!showStarfield ? 'bg-[#460b6c]' : ''}`}>
            <InfoBoard isPWA={isPWA} />
          </div>
        );
      case 'favorites':
        return (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Timeline showFavoritesOnly={true} />
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Settings
              showStarfield={showStarfield}
              onToggleStarfield={toggleStarfield}
              showAdmin={showAdmin}
              onToggleAdmin={toggleAdmin}
              onNavigateToAdmin={() => setCurrentView('admin')}
            />
          </div>
        );
      case 'admin':
        return (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Admin />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-[#460b6c] text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {showStarfield && <Starfield />}
      <div className="flex flex-col items-center justify-center gap-2 pt-4">
        <div className={`flex items-center justify-center w-full transition-all duration-300 transform ${isMusicExpanded ? 'opacity-0 scale-95 -translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
          <Image
            src="/android-chrome-192x192.png"
            alt="Hügelfest Logo"
            width={48}
            height={48}
          />
        </div>
        <div className="flex items-center gap-2">
          <MusicNote 
            onClick={() => setIsMusicActive(!isMusicActive)} 
            onExpandChange={setIsMusicExpanded}
          />
          <button
            onClick={() => setIsMusicVisible(!isMusicVisible)}
            className="p-2 text-[#460b6c] hover:text-[#ff9900] transition-colors"
          >
            {isMusicVisible ? 'Musik ausblenden' : 'Musik einblenden'}
          </button>
        </div>
      </div>

      {showPushDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#460b6c] border border-[#ff9900]/20 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-[#ff9900] text-xl font-semibold mb-4">Push-Benachrichtigungen aktivieren?</h3>
            <p className="text-[#ff9900]/80 mb-6">
              Erhalte wichtige Updates und Neuigkeiten direkt auf deinem Gerät.
            </p>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  setShowPushDialog(false);
                  try {
                    const permission = await Notification.requestPermission();
                    document.cookie = 'pushAsked=true; path=/; SameSite=Lax; max-age=31536000';
                    
                    if (permission === 'granted') {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                      });

                      await fetch('/api/push/subscribe', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(subscription),
                      });

                      console.log('Push-Subscription erfolgreich erstellt');
                    }
                  } catch (error) {
                    console.error('Fehler bei der Push-Subscription:', error);
                  }
                }}
                className="flex-1 bg-[#ff9900] text-[#460b6c] py-2 px-4 rounded-lg font-medium hover:bg-[#ff9900]/90 transition-colors"
              >
                Aktivieren
              </button>
              <button
                onClick={() => {
                  setShowPushDialog(false);
                  document.cookie = 'pushAsked=true; path=/; SameSite=Lax; max-age=31536000';
                }}
                className="flex-1 border border-[#ff9900] text-[#ff9900] py-2 px-4 rounded-lg font-medium hover:bg-[#ff9900]/10 transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-20">
        {renderContent()}
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 ${showStarfield ? 'bg-[#460b6c]/90' : 'bg-[#460b6c]'} backdrop-blur-md border-t border-[#ff9900]/20 z-50 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-between items-center h-16 px-2 sm:px-4">
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as View)}
              className={`flex items-center justify-center min-w-[60px] transition-all duration-200 ${
                currentView === id 
                  ? 'text-[#ff9900] scale-110' 
                  : 'text-[#ff9900]/60 hover:text-[#ff9900]'
              }`}
            >
              <div className={`p-2 rounded-full transition-colors duration-200 ${
                currentView === id 
                  ? 'bg-[#ff9900]/20' 
                  : 'bg-transparent'
              }`}>
                <Icon size={24} />
              </div>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
} 