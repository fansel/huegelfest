'use client';

import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import AdminSettings from './AdminSettings';
import ImpressumSettings from './ImpressumSettings';
import DatenschutzSettings from './DatenschutzSettings';
import ResetAppDataSettings from './ResetAppDataSettings';
import MusicNoteSettings from './MusicNoteSettings';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import AppUpdateSettings from './AppUpdateSettings';


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
        <AdminSettings variant="row" />
        <DatenschutzSettings variant="row" />
        <ImpressumSettings variant="row" />
        <ResetAppDataSettings variant="row" />
        <AppUpdateSettings variant="row" />
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
        <AdminSettings variant="tile" />
        <DatenschutzSettings variant="tile" />
        <ImpressumSettings variant="tile" />
        <ResetAppDataSettings variant="tile" />
        <AppUpdateSettings variant="tile" />
      </div>
    </div>
  );
}
