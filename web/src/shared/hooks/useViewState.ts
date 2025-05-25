import { useState } from 'react';
import { AdminTab } from '@/features/admin/types/AdminTab';

type View =
  | 'home'
  | 'anreise'
  | 'carpool'
  | 'infoboard'
  | 'settings'
  | 'admin'
  | 'favorites'
  | 'announcements'
  | 'workingGroups'
  | 'timeline'
  | 'admin-settings'
  | 'signup'
  | 'packlist';

export function useViewState(isAdmin: boolean) {
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