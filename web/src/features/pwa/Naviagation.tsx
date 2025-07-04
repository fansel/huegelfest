'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Megaphone, Settings as SettingsIcon, Heart, Shield, Users, Users2, Clock, SlidersHorizontal, Music, ClipboardList, Car, Check, CalendarCheck, BookOpen, Wrench, HelpCircle } from 'lucide-react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';

interface Tab {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface BottomBarProps {
  mode: 'user' | 'admin';
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdminActive: boolean;
  onAdminToggle: () => void;
  showAdminButton: boolean;
  isTemporarySession?: boolean;
}

// Custom Hook für Auto-Hide Navigation
function useAutoHideNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [ticking, setTicking] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Kleinerer Schwellenwert für sanftere Reaktion
      if (Math.abs(scrollY - lastScrollY) < 5) {
        setTicking(false);
        return;
      }

      setIsScrolling(true);
      
      // Scroll-Timeout zurücksetzen
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
      
      // Größere Schwellenwerte für stabileres Verhalten
      const HIDE_THRESHOLD = 80; // Erst nach 80px nach unten scrollen ausblenden
      const SHOW_THRESHOLD = 20; // Bei 20px nach oben scrollen wieder einblenden
      const TOP_THRESHOLD = 100; // Ganz oben immer sichtbar
      
      // Nach unten scrollen = ausblenden (nur bei ausreichend Scroll-Abstand)
      if (scrollY > lastScrollY && scrollY > HIDE_THRESHOLD && (scrollY - lastScrollY) > 10) {
        setIsVisible(false);
      } 
      // Nach oben scrollen = einblenden (schon bei kleiner Bewegung)
      else if (scrollY < lastScrollY && (lastScrollY - scrollY) > 5) {
        setIsVisible(true);
      }
      // Ganz oben = immer sichtbar
      else if (scrollY <= TOP_THRESHOLD) {
        setIsVisible(true);
      }

      setLastScrollY(scrollY);
      setTicking(false);
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDir);
        setTicking(true);
      }
    };

    // Touch-Events für bessere mobile Behandlung
    const onTouchStart = () => {
      // Bei Touch-Start Navigation sichtbar machen für bessere Interaktion
      setIsVisible(true);
    };

    const onTouchEnd = () => {
      // Nach Touch-Ende kurz warten bevor Auto-Hide wieder aktiv wird
      setTimeout(() => {
        if (!isScrolling) {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          if (scrollY > 100) {
            setIsVisible(false);
          }
        }
      }, 300);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, ticking, isScrolling]);

  return isVisible;
}

const userTabs: Tab[] = [
  { id: 'home', icon: <Calendar size={24} />, label: 'Timeline' },
  { id: 'carpool', icon: <Car size={24} />, label: 'Mitfahren' },
  { id: 'activities', icon: <Check size={24} />, label: 'Aufgaben' },
  { id: 'concepts', icon: <HelpCircle size={24} />, label: 'FAQ' },
  { id: 'infoboard', icon: <Megaphone size={24} />, label: 'News' },
  { id: 'favorites', icon: <Heart size={24} />, label: 'Favoriten' },
  { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Einstellungen' },
];

const adminTabs: Tab[] = [
  { id: 'announcements', icon: <Megaphone size={24} />, label: 'Ankündigungen' },
  { id: 'workingGroups', icon: <Wrench size={24} />, label: 'Arbeitsgruppen' },
  { id: 'timeline', icon: <Clock size={24} />, label: 'Timeline' },
  { id: 'music', icon: <Music size={24} />, label: 'Musik' },
  { id: 'groups', icon: <Users2 size={24} />, label: 'Gruppen' },
  { id: 'task-manager', icon: <CalendarCheck size={24} />, label: 'Aufgaben' },
  { id: 'admin-settings', icon: <SlidersHorizontal size={24} />, label: 'Admin-Einstellungen' },
];

const signupPhaseTabs: Tab[] = [
  { id: 'signup', icon: <Users size={24} />, label: 'Anmeldung' },
  { id: 'carpool', icon: <Car size={24} />, label: 'Mitfahren' },
  { id: 'packlist', icon: <ClipboardList size={24} />, label: 'Packliste' },
  { id: 'concepts', icon: <HelpCircle size={24} />, label: 'FAQ' },
  { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Einstellungen' },
];

const BottomBar: React.FC<BottomBarProps> = ({ mode, activeTab, onTabChange, isAdminActive, onAdminToggle, showAdminButton, isTemporarySession }) => {
  const { signupOpen } = useGlobalState();
  const isOnline = useNetworkStatus();
  const { deviceType } = useDeviceContext();
  const isMobileLayout = deviceType === 'mobile';
  
  // Auto-Hide nur auf mobilen Geräten
  const isNavVisible = useAutoHideNavigation();

  // Admin-Button nur online anzeigen
  const showAdminButtonFinal = showAdminButton && isOnline;

  // Während der Anmeldephase: Admins sehen alle Admin-Tabs + User-Settings, User sehen Anmeldung + Einstellungen
  let tabs: Tab[];
  if (signupOpen && mode === 'admin') {
    tabs = [
      ...adminTabs,
    ];
  } else if (signupOpen) {
    tabs = signupPhaseTabs;
  } else {
    tabs = mode === 'admin' ? adminTabs : userTabs;
  }

  // Scroll-Indikator für Admin-Modus
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    if (mode !== 'admin') return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setShowFade(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    check();
    el.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [mode, tabs.length]);

  if (!isMobileLayout) {
    const topClass = isTemporarySession ? 'top-10' : 'top-0';
    return (
      <div className={`fixed left-0 right-0 ${topClass} z-50 bg-[#460b6c]/90 backdrop-blur-sm`}>
        <div className="flex items-center justify-center max-w-5xl mx-auto h-16 px-4 sm:px-6 lg:px-8 w-full gap-2 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12">
          {tabs.map(({ id, label }) => (
            <span
              key={id}
              onClick={() => onTabChange(id)}
              className={`cursor-pointer px-1 sm:px-2 select-none text-sm sm:text-base transition-colors duration-200 text-[#ff9900] whitespace-nowrap
                ${activeTab === id ? 'font-semibold' : 'hover:font-semibold hover:line-through'}`}
              aria-label={label}
              tabIndex={0}
              role="button"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTabChange(id); }}
            >
              {label}
            </span>
          ))}
          {showAdminButtonFinal && (
            <span
              onClick={onAdminToggle}
              className={`cursor-pointer px-1 sm:px-2 select-none text-sm sm:text-base transition-colors duration-200 text-[#ff9900] whitespace-nowrap
                ${isAdminActive ? 'font-semibold underline underline-offset-4' : 'hover:font-semibold hover:line-through'}`}
              aria-label="Admin-Modus"
              tabIndex={0}
              role="button"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAdminToggle(); }}
            >
              Admin
            </span>
          )}
        </div>
      </div>
    );
  }
  
  if (isMobileLayout) {
    const barPositionClasses = 'bottom-0 h-16 bg-[#460b6c] border-t-2 border-[#ff9900]';
    
    return (
      <nav 
        className={`main-bar fixed left-0 right-0 z-40 flex items-center ${barPositionClasses} shadow-t transition-transform duration-500 ease-out`}
        style={{
          transform: isNavVisible ? 'translateY(0)' : 'translateY(100%)',
          willChange: 'transform',
        }}
      >
        <div className="flex w-full justify-between">
          {tabs.map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center min-w-0 transition-all duration-200 ${activeTab === id ? 'text-[#ff9900] scale-110' : 'text-[#ff9900]/60 hover:text-[#ff9900]'}`}
              aria-label={id}
            >
              <div className={`p-2 rounded-full transition-colors duration-200 ${activeTab === id ? 'bg-[#ff9900]/20' : 'bg-transparent'}`}>{icon}</div>
            </button>
          ))}
          {/* Shield-Button nur wenn showAdminButtonFinal true ist */}
          {showAdminButtonFinal && (
            <button
              onClick={onAdminToggle}
              className={`flex-1 flex flex-col items-center justify-center min-w-0 transition-all duration-200 ${isAdminActive ? 'text-white scale-110' : 'text-[#ff9900]/60 hover:text-[#ff9900]'} `}
              aria-label="Admin-Modus"
            >
              <div className={`p-2 rounded-full transition-colors duration-200 ${isAdminActive ? 'bg-[#ff9900]' : 'bg-[#ff9900]/10'}`}>
                <Shield size={24} />
              </div>
            </button>
          )}
        </div>
      </nav>
    );
  }
};

export default BottomBar; 