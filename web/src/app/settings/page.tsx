'use client';
import Settings from '@/features/settings/components/Settings';
import { useState } from 'react';

export default function SettingsPage() {
  // Beispielhafte State- und Handler-Implementierung
  const [showStarfield, setShowStarfield] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const handleToggleStarfield = (value: boolean) => setShowStarfield(value);
  const handleToggleAdmin = (value: boolean) => setShowAdmin(value);
  const handleLogout = () => setIsAuthenticated(false);
  const handleLogin = async (username: string, password: string) => {
    // Dummy-Login-Logik
    setIsAuthenticated(true);
    setLoginError('');
  };
  const handleNavigateToAdmin = () => {};

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Einstellungen</h1>
      <Settings
        showStarfield={showStarfield}
        onToggleStarfield={handleToggleStarfield}
      />
    </div>
  );
}
