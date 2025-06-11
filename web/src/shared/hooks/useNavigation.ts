import { useState, useEffect } from 'react';
import { View } from '@/shared/types/view';
import { AdminTab } from '@/features/admin/types/AdminTab';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { useAuth } from '@/features/auth/AuthContext';

export function useNavigation(isAdmin: boolean) {
  const [activeTab, setActiveTab] = useState<View>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('announcements');
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const { signupOpen } = useGlobalState();
  const { isTemporarySession, user } = useAuth();

  // Check if admin functionality should be available
  // Admin functionality is available if:
  // 1. User is admin (isAdmin = true), AND
  // 2. Either not in temporary session OR current user role is admin
  const canAccessAdmin = isAdmin && (!isTemporarySession || user?.role === 'admin');

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

  // Wenn Admin-Rechte entzogen werden oder temporäre Session zu Non-Admin, zurück zum User-Modus
  useEffect(() => {
    if (mode === 'admin' && !canAccessAdmin) {
      console.log('[Navigation] Admin access lost, switching to user mode. isAdmin:', isAdmin, 'isTemporarySession:', isTemporarySession, 'userRole:', user?.role);
      setMode('user');
      setActiveTab('home');
    }
  }, [canAccessAdmin, mode, isAdmin, isTemporarySession, user?.role]);

  const handleAdminToggle = () => {
    // Bei temporären Sessions zu Non-Admin User Admin-Zugang blockieren
    if (!canAccessAdmin) {
      console.log('[Navigation] Admin toggle blocked. isAdmin:', isAdmin, 'isTemporarySession:', isTemporarySession, 'userRole:', user?.role);
      return;
    }

    if (mode === 'admin') {
      setMode('user');
      // Je nach Signup-Phase das richtige erste Tab setzen
      setActiveTab(signupOpen ? 'signup' : 'home');
    } else if (canAccessAdmin) {
      setMode('admin');
    }
  };

  const handleTabChange = (tab: string) => {
    if (mode === 'admin') setAdminActiveTab(tab as AdminTab);
    else setActiveTab(tab as View);
  };

  return {
    mode,
    activeTab,
    adminActiveTab,
    handleAdminToggle,
    handleTabChange,
    // Admin-Button nur anzeigen wenn Admin-Zugang verfügbar ist
    showAdminButton: canAccessAdmin
  };
} 