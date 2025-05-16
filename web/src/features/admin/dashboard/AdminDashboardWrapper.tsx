'use client';
import React from 'react';
import AdminDashboardMobile from './AdminDashboardMobile';
import AdminDashboardDesktop from './AdminDashboardDesktop';
import type { AdminTab } from '../types/AdminTab';
import { usePWA } from '@/contexts/PWAContext';

interface AdminDashboardWrapperProps {
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
}

const AdminDashboardWrapper: React.FC<AdminDashboardWrapperProps> = ({ activeAdminTab, setActiveAdminTab }) => {
  const { isMobile } = usePWA();
  return isMobile
    ? <AdminDashboardMobile activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />
    : <AdminDashboardDesktop />;
};

export default AdminDashboardWrapper; 