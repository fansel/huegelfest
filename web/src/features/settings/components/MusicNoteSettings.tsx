'use client';

import UserSettingsCard from './UserSettingsCard';
import { Music } from 'lucide-react';
import { Switch } from '@/shared/components/ui/switch';

interface MusicNoteSettingsProps {
  showMusicNote: boolean;
  onToggle: (value: boolean) => void;
  variant?: 'row' | 'tile';
}

const MusicNoteSettings: React.FC<MusicNoteSettingsProps> = ({ showMusicNote, onToggle, variant = 'row' }) => {
  return (
    <UserSettingsCard
      icon={<Music className="w-5 h-5 text-[#ff9900]" />}
      title="Music Note"
      switchElement={
        <div className="flex items-center gap-1">
          <Switch checked={showMusicNote} onCheckedChange={onToggle} />
        </div>
      }
      info="Zeige die animierte Music Note oben rechts."
      variant={variant}
    />
  );
};

export default MusicNoteSettings; 