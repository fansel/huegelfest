import React from 'react';
import { AdminDashboardClient } from './AdminDashboardClient';
import type { AdminTab } from '../types/AdminTab';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getWorkingGroupsArrayAction } from '@/features/workingGroups/actions/getWorkingGroupColors';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { getPendingEventsAction } from '@/features/timeline/actions/getPendingEventsAction';
import { getAllTracks } from '@/features/music/actions/getAllTracks';
import { fetchGroupsData } from '@/features/admin/components/groups/actions/fetchGroupsData';
import { fetchActivitiesData } from '@/features/admin/components/activities/actions/fetchActivitiesData';

interface AdminDashboardProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = async ({ activeTab, setActiveTab }) => {
  // Load all data server-side for SSR
  const [announcementsData, workingGroups, categories, pendingEvents, tracks, groupsData, activitiesData] = await Promise.all([
    getAllAnnouncementsAction(),
    getWorkingGroupsArrayAction(), 
    getCategoriesAction(),
    getPendingEventsAction(),
    getAllTracks(),
    fetchGroupsData(),
    fetchActivitiesData()
  ]);

  // Map announcements with group info
  const announcements = announcementsData.map((a: any) => ({
    ...a,
    groupName: a.groupInfo?.name || '',
    groupColor: a.groupInfo?.color || '',
  }));

  return (
    <AdminDashboardClient 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      initialAnnouncements={announcements}
      initialWorkingGroups={workingGroups}
      initialCategories={categories}
      initialPendingEvents={pendingEvents}
      initialTracks={tracks}
      initialGroupsData={groupsData}
      initialActivitiesData={activitiesData}
    />
  );
};

export default AdminDashboard; 