'use client';
import React from 'react';
import { Calendar, MapPin, Megaphone, Settings as SettingsIcon, Heart, Shield, Users, Clock, SlidersHorizontal, Music } from 'lucide-react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useFestivalSignupPhase } from '@/contexts/FestivalSignupPhaseContext';

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
  { id: 'anreise', icon: <MapPin size={24} />, label: 'Anreise' },
  { id: 'infoboard', icon: <Megaphone size={24} />, label: 'News' },
  { id: 'favorites', icon: <Heart size={24} />, label: 'Favoriten' },
  { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Einstellungen' },
];

const adminTabs: Tab[] = [
  { id: 'announcements', icon: <Megaphone size={24} />, label: 'Ankündigungen' },
  { id: 'groups', icon: <Users size={24} />, label: 'Gruppen' },
  { id: 'timeline', icon: <Clock size={24} />, label: 'Timeline' },
  { id: 'music', icon: <Music size={24} />, label: 'Musik' },
  { id: 'admin-settings', icon: <SlidersHorizontal size={24} />, label: 'Admin-Einstellungen' },
];

const signupPhaseTabs: Tab[] = [
  { id: 'signup', icon: <Users size={24} />, label: 'Anmeldung' },
];

const BottomBar: React.FC<BottomBarProps> = ({ mode, activeTab, onTabChange, isAdminActive, onAdminToggle, showAdminButton }) => {
  const { isSignupPhase, isAdminPreview } = useFestivalSignupPhase();
  const isOnline = useNetworkStatus();

  // Während der Anmeldephase: Nur Anmeldung-Tab für normale Nutzer (außer Admins oder Admin-Preview)
  let tabs: Tab[];
  if (isSignupPhase && !(mode === 'admin' && !isAdminPreview)) {
    tabs = signupPhaseTabs;
  } else {
    tabs = mode === 'admin' ? adminTabs : userTabs;
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-[#460b6c]/90 backdrop-blur-md border-t border-[#ff9900]/20 pb-[env(safe-area-inset-bottom)] shadow-t`}> 
      <div className="flex justify-between items-center h-16 px-2 sm:px-4">
        {tabs.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center min-w-[60px] transition-all duration-200 ${activeTab === id ? 'text-[#ff9900] scale-110' : 'text-[#ff9900]/60 hover:text-[#ff9900]'}`}
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
            className={`flex flex-col items-center justify-center min-w-[60px] transition-all duration-200 ${isAdminActive ? 'text-white scale-110' : 'text-[#ff9900]/60 hover:text-[#ff9900]'} `}
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
};

export default BottomBar; 