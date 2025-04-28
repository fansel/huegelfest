'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Megaphone, Settings as SettingsIcon, Heart, Shield } from 'lucide-react';
import Timeline from './Timeline';
import InfoBoard from './InfoBoard';
import Anreise from '../app/anreise/page';
import Admin from '../app/admin/page';
import Login from './Login';
import Starfield from './Starfield';
import PushNotificationSettings from './PushNotificationSettings';
import Settings from './settings/Settings';

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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateIsPWA = (e: MediaQueryListEvent | MediaQueryList) => {
      const isStandaloneMode = e.matches || 
                             (window.navigator as Navigator & { standalone?: boolean }).standalone || 
                             document.referrer.includes('android-app://');
      setIsPWA(isStandaloneMode);
    };
    
    updateIsPWA(mediaQuery);
    mediaQuery.addEventListener('change', updateIsPWA);

    // Starfield-Einstellung aus Cookies laden
    const cookies = document.cookie.split(';');
    const starfieldCookie = cookies.find(cookie => cookie.trim().startsWith('showStarfield='));
    if (starfieldCookie) {
      setShowStarfield(starfieldCookie.trim().split('=')[1] === 'true');
    }
    
    return () => mediaQuery.removeEventListener('change', updateIsPWA);
  }, []);

  useEffect(() => {
    // Prüfe den Authentifizierungsstatus
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const auth = cookies.some(cookie => 
        cookie.trim().startsWith('isAuthenticated=') && 
        cookie.trim().split('=')[1] === 'true'
      );
      setIsAuthenticated(auth);
    };

    checkAuth();
  }, []);

  const handleLogin = (password: string) => {
    if (password === 'admin') {
      document.cookie = 'isAuthenticated=true; path=/; SameSite=Lax; max-age=31536000'; // 1 Jahr
      setIsAuthenticated(true);
      setLoginError('');
      setShowAdmin(true);
    } else {
      setLoginError('Falsches Passwort');
      setShowAdmin(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setShowAdmin(false);
    setCurrentView('home');
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

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
            <Timeline />
          </div>
        );
      case 'anreise':
        return (
          <div className={`flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center ${!showStarfield ? 'bg-[#460b6c]' : ''}`}>
            <Anreise />
          </div>
        );
      case 'infoboard':
        return (
          <div className={`flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center ${!showStarfield ? 'bg-[#460b6c]' : ''}`}>
            <InfoBoard />
          </div>
        );
      case 'favorites':
        return (
          <div className="flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
            <Timeline showFavoritesOnly={true} />
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
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
          <div className="flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
            <Admin />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
            <Login onLogin={handleLogin} error={loginError} />
          </div>
        );
      default:
        return null;
    }
  };

  if (!isPWA) return null;

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900]">
      {showStarfield && <Starfield />}
      <main 
        className={`pb-20 ${!showStarfield ? 'bg-[#460b6c]' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
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