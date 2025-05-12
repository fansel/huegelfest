'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import LegalNotice from './LegalNotice';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import PushNotificationSettingsServer from './PushNotificationSettingsServer';


interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
}: SettingsProps) {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  return (
    <div className="bg-[#460b6c]/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#460b6c]/20">
        <h2 className="text-[#ff9900] font-semibold text-xl">Einstellungen</h2>
        <p className="text-[#ff9900]/60 text-sm mt-1">Passe deine App-Einstellungen an</p>
      </div>

      {/* Einstellungen */}
      <div className="divide-y divide-[#460b6c]/20">
        {deviceId ? <PushNotificationSettings isSubscribed={false} deviceId={deviceId} /> : <div>Lade Push-Einstellungen...</div>}
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} />
        <AdminSettings />
        <LegalNotice />
      </div>
    </div>
  );
}
