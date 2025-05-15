'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import LegalNotice from './LegalNotice';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

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
    try {
      let id = localStorage.getItem('deviceId');
      if (!id) {
        id = btoa(`${navigator.userAgent}-${Date.now()}-${Math.random()}`);
        localStorage.setItem('deviceId', id);
        console.log('Neue deviceId generiert:', id);
      } else {
        console.log('deviceId aus localStorage:', id);
      }
      setDeviceId(id);
    } catch (e) {
      console.error('Fehler beim Setzen der deviceId:', e);
    }
  }, []);

  return (
    <div className="bg-[#460b6c]/30 rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-[#460b6c]/20">
        <h2 className="text-[#ff9900] font-semibold text-xl">Einstellungen</h2>
        <p className="text-[#ff9900]/60 text-sm mt-1">Passe deine App-Einstellungen an</p>
      </div>
      <div className="divide-y divide-[#460b6c]/20">
        <PushNotificationSettings isSubscribed={false} deviceId={deviceId} />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} />
        <AdminSettings />
        <LegalNotice />
      </div>
    </div>
  );
}
