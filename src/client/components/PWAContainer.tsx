'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Megaphone,
  Settings as SettingsIcon,
  Heart,
  Shield,
} from 'lucide-react';
import Timeline from './Timeline';
import InfoBoard from './InfoBoard';
import Anreise from '@/app/anreise/page';
import Admin from '@/app/admin/page';
import Login from './Login';
import Starfield from './Starfield';
import PushNotificationSettings from './PushNotificationSettings';
import Settings from './settings/Settings';
import MusicNote from './MusicNote';
import Image from 'next/image';

type View = 'home' | 'anreise' | 'infoboard' | 'settings' | 'admin' | 'favorites';

export default function PWAContainer() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isPWA, setIsPWA] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
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
          
          // Prüfe ob der Service Worker aktiv ist
          if (registration.active) {
            setPushSupported(true);
            
            // Prüfe ob wir bereits nach Push gefragt haben
            const cookies = document.cookie.split(';');
            const hasAskedForPush = cookies.some(cookie => 
              cookie.trim().startsWith('pushAsked=') && 
              cookie.trim().split('=')[1] === 'true'
            );

            if (!hasAskedForPush) {
              // Zeige Dialog nach kurzer Verzögerung
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

  useEffect(() => {
    // Prüfe den Authentifizierungsstatus
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error('Fehler beim Prüfen des Auth-Status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login fehlgeschlagen');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setCurrentView('admin');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setShowAdmin(false);
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEnd = e.touches[0].clientY;
    const diff = touchStart - touchEnd;

    if (diff > 50) { // Nach oben wischen
      setIsNavVisible(false);
    } else if (diff < -50) { // Nach unten wischen
      setIsNavVisible(true);
    }
  };

  const toggleStarfield = () => {
    const newValue = !showStarfield;
    setShowStarfield(newValue);
    document.cookie = `showStarfield=${newValue}; path=/; max-age=31536000`; // 1 Jahr
  };

  const toggleAdmin = () => {
    const newValue = !showAdmin;
    setShowAdmin(newValue);
    
    if (!newValue) {
      document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setIsAuthenticated(false);
    }
  };

  const toggleMusic = () => {
    setIsMusicActive(!isMusicActive);
  };

  const toggleMusicVisibility = () => {
    setIsMusicVisible(!isMusicVisible);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Wenn wir mehr als 50px nach unten gescrollt sind, blenden wir die Leiste aus
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      }
      // Wenn wir nach oben scrollen oder nah am Anfang sind, blenden wir die Leiste ein
      else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
          <div className={`flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center ${
            !showStarfield ? 'bg-[#460b6c]' : ''}`}>
            <Anreise />
          </div>
        );
      case 'infoboard':
        return (
          <div className={`flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center ${
            !showStarfield ? 'bg-[#460b6c]' : ''}`}>
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
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
              onLogin={handleLogin}
              loginError={loginError}
              onNavigateToAdmin={() => setCurrentView('admin')}
            />
          </div>
        );
      case 'admin':
        return isAuthenticated ? (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Admin />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start px-2 sm:px-6 py-0 sm:py-4 text-center">
            <Login 
              onLogin={async (username: string, password: string) => {
                try {
                  await handleLogin(username, password);
                } catch (error) {
                  setLoginError(error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten');
                  throw error;
                }
              }} 
              error={loginError} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  // if (!isPWA) return null; // Temporär auskommentiert während der Umstrukturierung

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
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
            onClick={toggleMusicVisibility}
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
                    // Speichere in Cookie, dass wir gefragt haben
                    document.cookie = 'pushAsked=true; path=/; SameSite=Lax; max-age=31536000'; // 1 Jahr
                    
                    if (permission === 'granted') {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                      });

                      // Subscription an Server senden
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
                  // Speichere in Cookie, dass wir gefragt haben
                  document.cookie = 'pushAsked=true; path=/; SameSite=Lax; max-age=31536000'; // 1 Jahr
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

      {isNavVisible && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#460b6c]/80 backdrop-blur-sm border-t border-[#ff9900]/20">
          <div className="flex justify-around items-center px-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center justify-center w-full py-2 ${
                  currentView === item.id
                    ? 'text-[#ff9900]'
                    : 'text-[#ff9900]/60 hover:text-[#ff9900]'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
      {isMusicVisible && currentView !== 'admin' && (
        <div className="fixed bottom-20 right-4 z-50">
          <MusicNote
            onClick={toggleMusic}
            onExpandChange={setIsMusicExpanded}
          />
        </div>
      )}
      {pushSupported && showPushDialog && (
        <PushNotificationSettings
          onClose={() => setShowPushDialog(false)}
        />
      )}
    </div>
  );
}
