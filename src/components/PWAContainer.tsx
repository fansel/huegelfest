'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Megaphone, Settings, User, Heart } from 'lucide-react';
import Timeline from './Timeline';
import InfoBoard from './InfoBoard';
import Anreise from '../app/anreise/page';
import Admin from '../app/admin/page';
import Login from './Login';
import { useRouter } from 'next/navigation';
import Starfield from './Starfield';
import PushNotificationSettings from './PushNotificationSettings';

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
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateIsPWA = (e: MediaQueryListEvent | MediaQueryList) => {
      const isStandaloneMode = e.matches || 
                             (window.navigator as any).standalone || 
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
      document.cookie = 'isAuthenticated=true; path=/; SameSite=Lax';
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Falsches Passwort');
    }
  };

  const handleLogout = () => {
    document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  // Basis-Navigation
  const baseNavItems = [
    { id: 'home', icon: Calendar, label: 'Timeline' },
    { id: 'anreise', icon: MapPin, label: 'Anreise' },
    { id: 'infoboard', icon: Megaphone, label: 'News' },
    { id: 'favorites', icon: Heart, label: 'Favoriten' },
    { id: 'settings', icon: Settings, label: 'Einstellungen' }
  ];

  // Admin-Navigation entfernen
  const navItems = baseNavItems;

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
    
    // Wenn Admin-Oberfläche ausgeschaltet wird, nur ausloggen
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
            <div className="w-full max-w-md mx-auto bg-[#460b6c]/40 backdrop-blur-sm rounded-lg p-6 border border-[#ff9900]/20">
              <h2 className="text-3xl font-bold mb-6 text-center text-[#ff9900]">Einstellungen</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[#ff9900]">Starfield Hintergrund</span>
                  <button
                    onClick={toggleStarfield}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${
                      showStarfield ? 'bg-[#ff9900]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                        showStarfield ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[#ff9900]">Admin-Oberfläche</span>
                  <button
                    onClick={toggleAdmin}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${
                      showAdmin ? 'bg-[#ff9900]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                        showAdmin ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {showAdmin && (
                  <div className="pt-4 border-t border-[#ff9900]/20">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-[#ff9900]">Admin-Bereich</h3>
                        <button
                          onClick={() => setCurrentView('admin')}
                          className="w-full py-2 px-4 bg-[#ff9900] text-[#460b6c] rounded-lg font-medium hover:bg-[#ff9900]/90 transition-colors"
                        >
                          Zum Admin-Bereich
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                          Ausloggen
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-[#ff9900]">Admin-Login</h3>
                        <Login onLogin={handleLogin} error={loginError} />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-4 border-t border-[#ff9900]/20">
                  <h3 className="text-xl font-semibold mb-4 text-[#ff9900]">Push-Benachrichtigungen</h3>
                  <PushNotificationSettings />
                </div>
              </div>
            </div>
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