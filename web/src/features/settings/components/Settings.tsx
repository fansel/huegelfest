'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import LegalNotice from './LegalNotice';
import BetaSettings from './BetaSettings';


interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
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
        <BetaSettings />
        <AdminSettings />
        <LegalNotice />
      </div>
    </div>
  );
}
