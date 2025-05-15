'use client';

import { useState, useEffect } from 'react';
import { Switch } from "@/shared/components/ui/switch";

interface StarfieldSettingsProps {
  showStarfield: boolean;
  onToggle: (value: boolean) => void;
}

export default function StarfieldSettings({
  showStarfield,
  onToggle,
}: StarfieldSettingsProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <span className="text-[#ff9900] font-medium text-lg">Starfield</span>
        <Switch checked={showStarfield} onCheckedChange={onToggle} />
      </div>
      <p className="text-[#ff9900]/60 text-sm mt-1">Sternenhimmel</p>
    </div>
  );
}
