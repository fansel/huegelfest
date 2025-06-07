'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import PushNotificationSettings from './PushNotificationSettings';
import StarfieldSettings from './StarfieldSettings';
import UserLogin from './UserLogin';
import LegalNotice from './LegalNotice';
import ResetAppDataSettings from './ResetAppDataSettings';
import MusicNoteSettings from './MusicNoteSettings';
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
        <PushNotificationSettings variant="row" />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} variant="row" />
        <MusicNoteSettings showMusicNote={showMusicNote} onToggle={onToggleMusicNote} variant="row" />
        <UpdateSettings variant="row" />
        <UserLogin variant="row" />
        <LegalNotice variant="row" />
        <ResetAppDataSettings variant="row" />
      </div>
    );
  }

  // Desktop: Grid mit 3 Spalten, Kachel-Design
  return (
    <div className="w-full max-w-5xl mx-auto py-12">
      <h2 className="text-2xl font-bold text-[#ff9900] mb-10 text-center">Einstellungen</h2>
      <div className="grid grid-cols-3 gap-8">
        <PushNotificationSettings variant="tile" />
        <StarfieldSettings showStarfield={showStarfield} onToggle={onToggleStarfield} variant="tile" />
        <MusicNoteSettings showMusicNote={showMusicNote} onToggle={onToggleMusicNote} variant="tile" />
        <UpdateSettings variant="tile" />
        <UserLogin variant="tile" />
        <LegalNotice variant="tile" />
        <ResetAppDataSettings variant="tile" />
      </div>
    </div>
  );
}
