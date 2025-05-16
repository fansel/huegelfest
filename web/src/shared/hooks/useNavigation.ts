import { useState } from 'react';
import { View } from '@/shared/types/view';
import { AdminTab } from '@/features/admin/types/AdminTab';

export function useNavigation(isAdmin: boolean) {
  const [activeTab, setActiveTab] = useState<View>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('announcements');
  const [mode, setMode] = useState<'user' | 'admin'>('user');

  const handleAdminToggle = () => {
    if (mode === 'admin') {
      setMode('user');
      setActiveTab('home');
    } else if (isAdmin) {
      setMode('admin');
    }
  };

  const handleTabChange = (tab: string) => {
    if (mode === 'admin') setAdminActiveTab(tab as AdminTab);
    else setActiveTab(tab as View);
  };

  return { mode, activeTab, adminActiveTab, handleAdminToggle, handleTabChange };
} 