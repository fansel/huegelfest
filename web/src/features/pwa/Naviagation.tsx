'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Calendar, Megaphone, Settings as SettingsIcon, Heart, Shield, Users, Users2, Clock, SlidersHorizontal, Music, ClipboardList, Car, Check, CalendarCheck } from 'lucide-react';
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
}

const userTabs: Tab[] = [
  { id: 'home', icon: <Calendar size={24} />, label: 'Timeline' },
  { id: 'carpool', icon: <Car size={24} />, label: 'Mitfahren' },
  { id: 'activities', icon: <Check size={24} />, label: 'Aufgaben' },
  { id: 'infoboard', icon: <Megaphone size={24} />, label: 'News' },
  { id: 'favorites', icon: <Heart size={24} />, label: 'Favoriten' },
  { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Einstellungen' },
];

const adminTabs: Tab[] = [
  { id: 'announcements', icon: <Megaphone size={24} />, label: 'Ankündigungen' },
  { id: 'workingGroups', icon: <Users size={24} />, label: 'Arbeitsgruppen' },
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
  { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Einstellungen' },
];

const BottomBar: React.FC<BottomBarProps> = ({ mode, activeTab, onTabChange, isAdminActive, onAdminToggle, showAdminButton }) => {
  const { signupOpen } = useGlobalState();
  const isOnline = useNetworkStatus();
  const { deviceType } = useDeviceContext();
  const isMobileLayout = deviceType === 'mobile';

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
    return (
      <div className="fixed left-0 right-0 top-0 z-50 bg-[#460b6c]/90 backdrop-blur-sm">
        <div className="flex items-center justify-center max-w-5xl mx-auto h-16 px-8 w-full">
          <div className="flex gap-16">
            {tabs.map(({ id, label }) => (
              <span
                key={id}
                onClick={() => onTabChange(id)}
                className={`cursor-pointer px-2 select-none text-base transition-colors duration-200 text-[#ff9900] 
                  ${activeTab === id ? 'font-semibold' : 'hover:font-semibold hover:line-through'}`}
                aria-label={label}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTabChange(id); }}
              >
                {label}
              </span>
            ))}
            {showAdminButton && (
              <span
                onClick={() => {
                  if (!isOnline) {
                    window.alert('Admin-Modus ist offline nicht verfügbar');
                    return;
                  }
                  onAdminToggle();
                }}
                className={`cursor-pointer px-2 select-none text-base transition-colors duration-200 text-[#ff9900] 
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
      </div>
    );
  }
  if (isMobileLayout) {
    const barPositionClasses = 'bottom-0 h-16 bg-[#460b6c] border-t-2 border-[#ff9900]';

    return (
      <nav className={`main-bar fixed left-0 right-0 z-50 flex items-center ${barPositionClasses} shadow-t`}>
        <div
          className="flex w-full justify-between"
        >
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
          {/* Shield-Button nur wenn showAdminButton true ist */}
          {showAdminButton && (
            <button
              onClick={() => {
                if (!isOnline) {
                  window.alert('Admin-Modus ist offline nicht verfügbar');
                  return;
                }
                onAdminToggle();
              }}
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