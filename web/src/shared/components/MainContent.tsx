import React from 'react';
import TimelineServer from '@/features/timeline/components/TimelineServer';
import InfoBoard from '@/features/infoboard/components/InfoBoard';
import Anreise from '@/features/anreise/components/page';
import Settings from '@/features/settings/components/Settings';
import AdminDashboard from '@/features/admin/dashboard/AdminDashboard';
import type { AdminTab } from '@/features/admin/types/AdminTab';
import { FavoritesList } from '@/features/favorites/components/FavoritesList';
import SignupPhaseInfo from '@/features/pwa/SignupPhaseInfo';
import Packlist from '@/features/packlist/Packlist';
import CarpoolManager from '@/features/registration/components/CarpoolManager';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import TimelineClient from '@/features/timeline/components/TimelineClient';
import { useUISettings } from '@/shared/contexts/UISettingsContext';
import { ADMIN_TABS } from '@/features/admin/types/AdminTab';


interface MainContentProps {
  mode: string;
  activeTab: string;
  adminActiveTab: string;
  handleTabChange: (tab: string) => void;
  timelineData: {
    days: any[];
    categories: any[];
  };
  infoBoardData: {
    announcements: any[];
    reactionsMap: Record<string, any>;
  };
}

function isValidAdminTab(tab: string): tab is AdminTab {
  return ADMIN_TABS.includes(tab as AdminTab);
}

const MainContent: React.FC<MainContentProps> = ({ mode, activeTab, adminActiveTab, handleTabChange, timelineData, infoBoardData }) => {
  const { signupOpen } = useGlobalState();
  const { showStarfield, setShowStarfield, showMusicNote, setShowMusicNote } = useUISettings();
  
  // Content je nach Modus und Tab
  if (signupOpen && mode !== 'admin') {
    if (activeTab === 'settings') {
      return (
        <Settings 
          showStarfield={showStarfield} 
          onToggleStarfield={setShowStarfield}
          showMusicNote={showMusicNote}
          onToggleMusicNote={setShowMusicNote}
        />
      );
    }
    if (activeTab === 'packlist') {
      return <Packlist />;
    }
    if (activeTab === 'carpool') {
      return <CarpoolManager />;
    }
    // Standard: Anmeldung
    return <SignupPhaseInfo />;
  }
  if (mode === 'admin') {
    const safeTab: AdminTab = isValidAdminTab(adminActiveTab) ? adminActiveTab : 'announcements';
    return <AdminDashboard activeTab={safeTab} setActiveTab={(tab: AdminTab) => handleTabChange(tab)} />;
  } else {
    switch (activeTab) {
      case 'home':
        return<TimelineClient days={timelineData.days} categories={timelineData.categories} />;
      case 'anreise':
        return <Anreise />;
      case 'carpool':
        return <CarpoolManager />;
      case 'infoboard':
        return <InfoBoard announcements={infoBoardData.announcements} reactionsMap={infoBoardData.reactionsMap} />;
      case 'favorites':
        return <FavoritesList />;
      case 'settings':
        return (
          <Settings 
            showStarfield={showStarfield} 
            onToggleStarfield={setShowStarfield}
            showMusicNote={showMusicNote}
            onToggleMusicNote={setShowMusicNote}
          />
        );
      case 'packlist':
        return <Packlist />;
      default:
        return null;
    }
  }
};

export default MainContent; 