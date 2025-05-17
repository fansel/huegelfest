'use client';
import React, { useState } from 'react';
import AdminDashboard from '../admin/dashboard/AdminDashboard';
import type { AdminTab } from '../admin/types/AdminTab';

export default function AdminPage() {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('announcements');
  return (
    <AdminDashboard activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />
  );
}
