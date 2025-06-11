import React from 'react';
import { AdminDashboardClient } from '../dashboard/AdminDashboardClient';
import type { AdminTab } from '../types/AdminTab';

interface AdminDashboardProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  initialAnnouncements: any[];
  initialWorkingGroups: any[];
  initialCategories: any[];
  initialPendingEvents: any[];
  initialTracks: any[];
  initialGroupsData: any;
  initialActivitiesData: any;
}

export function AdminDashboard(props: AdminDashboardProps) {
  return <AdminDashboardClient {...props} />;
}

export default AdminDashboard; 