import React, { useState } from 'react';
import AppLayout from '@/shared/components/AppLayout';
import AdminDashboardWrapper from '../admin/dashboard/AdminDashboardWrapper';
import type { AdminTab } from '../admin/types/AdminTab';

export default function AdminPage() {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('announcements');
  return (
    <AppLayout hideMusicNote>
      <AdminDashboardWrapper activeAdminTab={activeAdminTab} setActiveAdminTab={setActiveAdminTab} />
    </AppLayout>
  );
}