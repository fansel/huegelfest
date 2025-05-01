'use client';

import React from 'react';
import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
  showAdmin: boolean;
  onToggleAdmin: (value: boolean) => void;
  onNavigateToAdmin: () => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
  showAdmin,
  onToggleAdmin,
  onNavigateToAdmin
}: SettingsProps) {
  const { isAuthenticated } = useAuth();

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
          onNavigateToAdmin={onNavigateToAdmin}
        />
      </div>
    </div>
  );
} 