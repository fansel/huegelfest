'use client';
import React from 'react';
import BottomBar from '../../pwa/Naviagation';
import AnnouncementManager from '../components/announcements/AnnouncementManager'
import WorkingGroupManager from '../components/workingGroups/WorkingGroupManager';
import TimelineManager from '../components/timeline/TimelineManager';
import MusicManager from '../components/music/MusicManager';
import { GroupsOverviewWebSocket } from '../../groups/components/GroupsOverviewWebSocket';
import ActivityManager from '../../activities/components/ActivityManager';
import type { AdminTab } from '../types/AdminTab';
import Settings from '@/features/admin/components/settings/Settings';

const TABS: AdminTab[] = ['announcements', 'workingGroups', 'timeline', 'music', 'groups', 'task-manager', 'admin-settings'];

interface AdminDashboardClientProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="pb-16">
      {activeTab === 'announcements' && <AnnouncementManager />}
      {activeTab === 'workingGroups' && <WorkingGroupManager />}
      {activeTab === 'timeline' && <TimelineManager />}
      {activeTab === 'music' && <MusicManager />}
      {activeTab === 'groups' && <GroupsOverviewWebSocket />}
      {activeTab === 'task-manager' && <ActivityManager />}
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