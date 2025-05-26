import React from 'react';
import { AdminDashboardClient } from './AdminDashboardClient';
import type { AdminTab } from '../types/AdminTab';

interface AdminDashboardProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  return (
    <AdminDashboardClient activeTab={activeTab} setActiveTab={setActiveTab} />
  );
};

export default AdminDashboard; 