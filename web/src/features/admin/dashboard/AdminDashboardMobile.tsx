'use client';
import React, { useState } from 'react';
import BottomBar from '../../pwa/BottomBar';
import AnnouncementsMobile from '../components/announcements/AnnouncementsMobile'
import GroupsManagerMobile from '../components/groups/GroupsManagerMobile';
import TimelineMobile from '../components/timeline/TimelineMobile';
import MusicManager from '../components/music/MusicManager';
import type { AdminTab } from '../types/AdminTab';
// import TimelineManagerMobile from '../components/timeline/TimelineMobile';
// import GroupsMobile from './GroupsMobile'; // Placeholder, analog zu AnnouncementsMobile
// const TimelineMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Timeline mobil (kommt noch)</div>;

const TABS: AdminTab[] = ['announcements', 'groups', 'timeline', 'music'];
type Tab = typeof TABS[number];

// Dummy-Komponenten für Gruppen und Timeline
const GroupsMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Gruppenverwaltung mobil (kommt noch)</div>;

interface AdminDashboardMobileProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDashboardMobile: React.FC<AdminDashboardMobileProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="pb-16">
      {activeTab === 'announcements' && <AnnouncementsMobile />}
      {activeTab === 'groups' && <GroupsManagerMobile />}
      {activeTab === 'timeline' && <TimelineMobile />}
      {activeTab === 'music' && <MusicManager />}
      <BottomBar
        mode="admin"
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab as AdminTab)}
        isAdminActive={true}
        onAdminToggle={() => {}}
        showAdminButton={false}
      />
    </div>
  );
};

export default AdminDashboardMobile; 