'use client';
import React, { useState } from 'react';
import BottomBar from '../../pwa/Naviagation';
import AnnouncementsMobile from '../components/announcements/AnnouncementManager'
import GroupsManagerMobile from '../components/groups/GroupManager';
import TimelineMobile from '../components/timeline/TimelineManager';
import MusicManager from '../components/music/MusicManager';
import RegistrationManager from '../components/registration/RegistrationManager';
import type { AdminTab } from '../types/AdminTab';
import Settings from '@/features/admin/components/settings/Settings';
// import TimelineManagerMobile from '../components/timeline/TimelineMobile';
// import GroupsMobile from './GroupsMobile'; // Placeholder, analog zu AnnouncementsMobile
// const TimelineMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Timeline mobil (kommt noch)</div>;

const TABS: AdminTab[] = ['announcements', 'groups', 'timeline', 'music', 'registrations', 'admin-settings'];
type Tab = typeof TABS[number];

// Dummy-Komponenten für Gruppen und Timeline
const GroupsMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Gruppenverwaltung mobil (kommt noch)</div>;

interface AdminDashboardMobileProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDashboard: React.FC<AdminDashboardMobileProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="pb-16">
      {activeTab === 'announcements' && <AnnouncementsMobile />}
      {activeTab === 'groups' && <GroupsManagerMobile />}
      {activeTab === 'timeline' && <TimelineMobile />}
      {activeTab === 'music' && <MusicManager />}
      {activeTab === 'registrations' && <RegistrationManager />}
      {activeTab === 'admin-settings' && <Settings />}
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

export default AdminDashboard; 