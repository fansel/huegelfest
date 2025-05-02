'use client';

import { useState } from 'react';
import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';

interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
  showAdmin: boolean;
  onToggleAdmin: (value: boolean) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
  loginError: string;
  onNavigateToAdmin: () => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
  showAdmin,
  onToggleAdmin,
  isAuthenticated,
  onLogout,
  onLogin,
  loginError,
  onNavigateToAdmin
}: SettingsProps) {
  return (
    <div className="bg-[#460b6c]/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#460b6c]/20">
        <h2 className="text-[#ff9900] font-semibold text-xl">Einstellungen</h2>
        <p className="text-[#ff9900]/60 text-sm mt-1">Passe deine App-Einstellungen an</p>
      </div>

      {/* Einstellungen */}
      <div className="divide-y divide-[#460b6c]/20">
        <PushNotificationSettings />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} />
        <AdminSettings 
          showAdmin={showAdmin} 
          onToggle={onToggleAdmin}
          isAuthenticated={isAuthenticated}
          onLogout={onLogout}
          onLogin={onLogin}
          loginError={loginError}
          onNavigateToAdmin={onNavigateToAdmin}
        />
      </div>
    </div>
  );
}
