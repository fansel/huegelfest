'use client';
import React, { useState, useEffect } from 'react';
import BottomBar from '../../pwa/Naviagation';
import { AnnouncementManagerClient } from '../components/announcements/AnnouncementManagerClient';
import WorkingGroupManagerClient from '../components/workingGroups/WorkingGroupManagerClient';
import { TimelineManagerClient } from '../components/timeline/TimelineManagerClient';
import { MusicManagerClient } from '../components/music/MusicManagerClient';
import { GroupsOverviewWebSocketClient } from '../components/groups/components/GroupsOverviewWebSocketClient';
import ActivityManagerWrapper from '../components/activities/ActivityManagerWrapper';
import type { AdminTab } from '../types/AdminTab';
import Settings from '@/features/admin/components/settings/Settings';
import { fetchActivitiesData, type ActivitiesData } from '../components/activities/actions/fetchActivitiesData';
import { toast } from 'react-hot-toast';

const DEBUG = false;

const TABS: AdminTab[] = ['announcements', 'workingGroups', 'timeline', 'music', 'groups', 'task-manager', 'admin-settings'];

interface AdminDashboardClientProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  initialAnnouncements: any[];
  initialWorkingGroups: any[];
  initialCategories: any[];
  initialPendingEvents: any[];
  initialTracks: any[];
  initialGroupsData: any;
  initialActivitiesData: ActivitiesData;
}

export const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({ 
  activeTab, 
  setActiveTab, 
  initialAnnouncements, 
  initialWorkingGroups,
  initialCategories,
  initialPendingEvents,
  initialTracks,
  initialGroupsData,
  initialActivitiesData,
}) => {
  if (DEBUG) {
    console.log('[AdminDashboardClient] Initial Data:', {
      initialAnnouncements,
      initialWorkingGroups,
      initialCategories,
      initialPendingEvents,
      initialTracks,
      initialGroupsData,
      initialActivitiesData,
    });
  }

  return (
    <div className="pb-16">
      {activeTab === 'announcements' && (
        <AnnouncementManagerClient 
          initialAnnouncements={initialAnnouncements}
          initialWorkingGroups={initialWorkingGroups}
        />
      )}
      {activeTab === 'workingGroups' && (
        <WorkingGroupManagerClient initialWorkingGroups={initialWorkingGroups} />
      )}
      {activeTab === 'timeline' && (
        <TimelineManagerClient 
          initialCategories={initialCategories}
        />
      )}
      {activeTab === 'music' && (
        <MusicManagerClient initialTracks={initialTracks} />
      )}
      {activeTab === 'groups' && (
        <GroupsOverviewWebSocketClient initialData={initialGroupsData} />
      )}
      {activeTab === 'task-manager' && (
        <ActivityManagerWrapper initialData={initialActivitiesData} />
      )}
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