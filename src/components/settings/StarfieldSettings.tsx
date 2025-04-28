'use client';

import { useState, useEffect } from 'react';

interface StarfieldSettingsProps {
  showStarfield: boolean;
  onToggle: (value: boolean) => void;
}

export default function StarfieldSettings({ showStarfield, onToggle }: StarfieldSettingsProps) {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Starfield Hintergrund</span>
          <span className="text-[#ff9900]/60 text-sm">Aktiviere den animierten Sternenhimmel</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showStarfield}
              onChange={() => onToggle(!showStarfield)}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900] hover:bg-gray-300"></div>
          </label>
        </div>
      </div>
    </div>
  );
} 