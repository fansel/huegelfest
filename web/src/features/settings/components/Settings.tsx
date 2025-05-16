'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import LegalNotice from './LegalNotice';
import dynamic from 'next/dynamic';
import { useDeviceId } from '@/shared/hooks/useDeviceId';

interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
}: SettingsProps) {
  const deviceId = useDeviceId();

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
