import React from 'react';
import TimelineServer from '@/features/timeline/components/TimelineServer';
import InfoBoard from '@/features/infoboard/components/InfoBoard';
import Settings from '@/features/settings/components/Settings';
import { AdminDashboardClient } from '@/features/admin/dashboard/AdminDashboardClient';
import type { AdminTab } from '@/features/admin/types/AdminTab';
import { FavoritesList } from '@/features/favorites/components/FavoritesList';
import SignupPhaseInfo from '@/features/pwa/SignupPhaseInfo';
import PacklistClient from '@/features/packlist/components/PacklistClient';
import CarpoolClient from '@/features/registration/components/CarpoolClient';
import ActivitiesServer from '@/features/activities/components/ActivitiesServer';
import ConceptsServer from '@/features/concepts/components/ConceptsServer';
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
  carpoolData: any[];
  packlistData: any[];
  adminData?: {
    announcements: any[];
    workingGroups: any[];
    categories: any[];
    pendingEvents: any[];
    tracks: any[];
    groupsData: any;
    activitiesData: any;
  } | null;
  loadingAdminData?: boolean;
}

function isValidAdminTab(tab: string): tab is AdminTab {
  return ADMIN_TABS.includes(tab as AdminTab);
}

const MainContent: React.FC<MainContentProps> = ({ mode, activeTab, adminActiveTab, handleTabChange, timelineData, infoBoardData, carpoolData, packlistData, adminData, loadingAdminData }) => {
  const { signupOpen } = useGlobalState();
  const { showStarfield, setShowStarfield, showMusicNote, setShowMusicNote } = useUISettings();
  
  // Content je nach Modus und Tab
  if (mode === 'admin') {
    const safeTab: AdminTab = isValidAdminTab(adminActiveTab) ? adminActiveTab : 'announcements';
    
    if (loadingAdminData) {
      return <div className="flex items-center justify-center h-64">Lade aktuelle Admin-Daten...</div>;
    }
    
    if (!adminData) {
      return <div className="flex items-center justify-center h-64">Lade Admin-Daten...</div>;
    }
    
    return (
      <AdminDashboardClient 
        activeTab={safeTab} 
        setActiveTab={(tab: AdminTab) => handleTabChange(tab)}
        initialAnnouncements={adminData.announcements}
        initialWorkingGroups={adminData.workingGroups}
        initialCategories={adminData.categories}
        initialPendingEvents={adminData.pendingEvents}
        initialTracks={adminData.tracks}
        initialGroupsData={adminData.groupsData}
        initialActivitiesData={adminData.activitiesData}
      />
    );
  } else {
    switch (activeTab) {
      case 'home':
        return <TimelineClient days={timelineData.days} categories={timelineData.categories} />;
      case 'carpool':
        return <CarpoolClient initialRides={carpoolData} />;
      case 'activities':
        return <ActivitiesServer />;
      case 'concepts':
        return <ConceptsServer />;
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
        return <PacklistClient initialItems={packlistData} />;
      case 'signup':
        // Anmeldung nur anzeigen, wenn explizit der signup-Tab ausgewählt ist
        return <SignupPhaseInfo />;
      default:
        return null;
    }
  }
};

export default MainContent; 