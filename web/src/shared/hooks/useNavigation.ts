import { useState, useEffect } from 'react';
import { View } from '@/shared/types/view';
import { AdminTab } from '@/features/admin/types/AdminTab';
import { useGlobalState } from '@/contexts/GlobalStateContext';

export function useNavigation(isAdmin: boolean) {
  const [activeTab, setActiveTab] = useState<View>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('announcements');
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const { signupOpen } = useGlobalState();

  // Automatisch auf das erste verfügbare Tab wechseln, wenn sich die Signup-Phase ändert
  useEffect(() => {
    if (mode === 'admin') return; // Admin-Modus nicht beeinflussen
    
    if (signupOpen) {
      // Signup-Phase: Erstes Tab ist 'signup'
      if (activeTab === 'home') {
        setActiveTab('signup');
      }
    } else {
      // Normale Phase: Erstes Tab ist 'home'
      if (activeTab === 'signup') {
        setActiveTab('home');
      }
    }
  }, [signupOpen, mode, activeTab]);

  const handleAdminToggle = () => {
    if (mode === 'admin') {
      setMode('user');
      // Je nach Signup-Phase das richtige erste Tab setzen
      setActiveTab(signupOpen ? 'signup' : 'home');
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