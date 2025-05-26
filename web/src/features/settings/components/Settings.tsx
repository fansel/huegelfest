'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import ImpressumSettings from './ImpressumSettings';
import DatenschutzSettings from './DatenschutzSettings';
import ResetAppDataSettings from './ResetAppDataSettings';
import MusicNoteSettings from './MusicNoteSettings';
import DeviceTransferSettings from '@/features/magic-codes/components/DeviceTransferSettings';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { UpdateSettings } from './UpdateSettings';

interface SettingsProps {
  showStarfield: boolean;
  onToggleStarfield: (value: boolean) => void;
  showMusicNote: boolean;
  onToggleMusicNote: (value: boolean) => void;
}

export default function Settings({
  showStarfield,
  onToggleStarfield,
  showMusicNote,
  onToggleMusicNote,
}: SettingsProps) {
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile'

  if (isMobile) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[#ff9900] mb-6 text-center">Einstellungen</h2>
        <PushNotificationSettings isSubscribed={false} variant="row" />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} variant="row" />
        <MusicNoteSettings showMusicNote={showMusicNote} onToggle={onToggleMusicNote} variant="row" />
        <UpdateSettings variant="row" />
        <DeviceTransferSettings />
        <AdminSettings variant="row" />
        <DatenschutzSettings variant="row" />
        <ImpressumSettings variant="row" />
        <ResetAppDataSettings variant="row" />
      </div>
    );
  }

  // Desktop: Grid mit 3 Spalten, Kachel-Design
  return (
    <div className="w-full max-w-5xl mx-auto py-12">
      <h2 className="text-2xl font-bold text-[#ff9900] mb-10 text-center">Einstellungen</h2>
      <div className="grid grid-cols-3 gap-8">
        <PushNotificationSettings isSubscribed={false} variant="tile" />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} variant="tile" />
        <MusicNoteSettings showMusicNote={showMusicNote} onToggle={onToggleMusicNote} variant="tile" />
        <UpdateSettings variant="tile" />
        <DeviceTransferSettings />
        <AdminSettings variant="tile" />
        <DatenschutzSettings variant="tile" />
        <ImpressumSettings variant="tile" />
        <ResetAppDataSettings variant="tile" />
      </div>
    </div>
  );
}
