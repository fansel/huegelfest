'use client';

import { useMusicPlayerStore } from '@/client/store/musicPlayerStore';

export default function MusicPlayerSettings() {
  const isEnabled = useMusicPlayerStore((state) => state.isEnabled);
  const setIsEnabled = useMusicPlayerStore((state) => state.setIsEnabled);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-[#ff9900] font-medium">Musikplayer</span>
          <span className="text-[#ff9900]/60 text-sm">
            Der Musikplayer ist aktuell nicht verfügbar und wird in einem späteren Update aktiviert.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
              disabled={true}
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9900]"></div>
          </label>
        </div>
      </div>
    </div>
  );
} 