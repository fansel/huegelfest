'use client';
import React, { useState } from 'react';
import BottomBar from '../../pwa/Naviagation';
import AnnouncementManager from '../components/announcements/AnnouncementManager'
import WorkingGroupManager from '../components/workingGroups/WorkingGroupManager';
import TimelineManager from '../components/timeline/TimelineManager';
import MusicManager from '../components/music/MusicManager';
import { GroupsOverview } from '../../groups/components/GroupsOverview';
import type { AdminTab } from '../types/AdminTab';
import Settings from '@/features/admin/components/settings/Settings';

const TABS: AdminTab[] = ['announcements', 'workingGroups', 'timeline', 'music', 'registrations', 'groups', 'admin-settings'];

interface AdminDashboardProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="pb-16">
      {activeTab === 'announcements' && <AnnouncementManager />}
      {activeTab === 'workingGroups' && <WorkingGroupManager />}
      {activeTab === 'timeline' && <TimelineManager />}
      {activeTab === 'music' && <MusicManager />}
      {activeTab === 'registrations' && <GroupsOverview />}
      {activeTab === 'groups' && <GroupsOverview />}
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