'use client';
import React, { useState } from 'react';
import BottomBar from '../../pwa/BottomBar';
import AnnouncementsMobile from '../components/announcements/AnnouncementsMobile'
import GroupsManagerMobile from '../components/groups/GroupsManagerMobile';
import TimelineManagerMobile from '../components/timeline/TimelineManagerMobile';
// import GroupsMobile from './GroupsMobile'; // Placeholder, analog zu AnnouncementsMobile
// import TimelineMobile from './TimelineMobile'; // Placeholder, analog zu AnnouncementsMobile

const TABS = ['announcements', 'groups', 'timeline'] as const;
type Tab = typeof TABS[number];

// Dummy-Komponenten für Gruppen und Timeline
const GroupsMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Gruppenverwaltung mobil (kommt noch)</div>;
const TimelineMobile: React.FC = () => <div className="p-6 text-center text-lg text-gray-500">Timeline mobil (kommt noch)</div>;

interface AdminDashboardMobileProps {
  activeTab: 'announcements' | 'groups' | 'timeline';
}

const AdminDashboardMobile: React.FC<AdminDashboardMobileProps> = ({ activeTab }) => {
  // Debug: Logge den aktuellen Tab bei jedem Render
  console.log('[AdminDashboardMobile] Aktiver Tab:', activeTab);

  return (
    <div className="pb-16">
      {activeTab === 'announcements' && <AnnouncementsMobile />}
      {activeTab === 'groups' && <GroupsManagerMobile />}
      {activeTab === 'timeline' && <TimelineManagerMobile />}
    </div>
  );
};

export default AdminDashboardMobile; 