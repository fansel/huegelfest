'use client';
import React from 'react';
import AdminDashboardMobile from './AdminDashboardMobile';
import AdminDashboardDesktop from './AdminDashboardDesktop';
import useIsMobile from '../hooks/useIsMobile';

interface AdminDashboardWrapperProps {
  activeAdminTab: 'announcements' | 'groups' | 'timeline';
}

const AdminDashboardWrapper: React.FC<AdminDashboardWrapperProps> = ({ activeAdminTab }) => {
  const isMobile = useIsMobile();
  return isMobile ? <AdminDashboardMobile activeTab={activeAdminTab} /> : <AdminDashboardDesktop />;
};

export default AdminDashboardWrapper; 