'use client';
import React from 'react';
import AdminDashboardMobile from './AdminDashboardMobile';
import AdminDashboardDesktop from './AdminDashboardDesktop';
import useIsMobile from '../hooks/useIsMobile';
import type { AdminTab } from '../types/AdminTab';

interface AdminDashboardWrapperProps {
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
}

const AdminDashboardWrapper: React.FC<AdminDashboardWrapperProps> = ({ activeAdminTab, setActiveAdminTab }) => {
  const isMobile = useIsMobile();
  // Defensive: Fallback auf 'announcements' falls Tab ungültig
  const safeTab: AdminTab = ['announcements', 'groups', 'timeline', 'music', 'registrations', 'admin-settings', 'packlist'].includes(activeAdminTab) ? activeAdminTab : 'announcements';
  return isMobile ? <AdminDashboardMobile activeTab={safeTab} setActiveTab={setActiveAdminTab} /> : <AdminDashboardDesktop />;
};

export default AdminDashboardWrapper; 