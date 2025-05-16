'use client';

import MainContent from './MainContent';
import BottomBar from '@/features/pwa/BottomBar';
import OfflineBanner from './OfflineBanner';
import { Starfield } from './Starfield';
import MusicNote from '@/features/music/components/MusicNote';
import { useNavigation } from '@/shared/hooks/useNavigation';
import Image from 'next/image';

interface PWAContainerClientProps {
  isAdmin: boolean;
  timelineData: {
    days: any[];
    categories: any[];
  };
  infoBoardData: {
    announcements: any[];
    reactionsMap: Record<string, any>;
    deviceId: string;
  };
}

export default function PWAContainerClient({ isAdmin, timelineData, infoBoardData }: PWAContainerClientProps) {
  const { mode, activeTab, adminActiveTab, handleAdminToggle, handleTabChange } = useNavigation(isAdmin);

  return (
    <div className="relative min-h-screen bg-[#460b6c] text-[#ff9900] flex flex-col">
      <OfflineBanner />
      <Starfield />
      <div className="absolute top-4 right-4 z-50">
        <MusicNote />
      </div>
      <div className="flex flex-col items-center justify-center gap-2 pt-4">
        <div className="flex items-center justify-center w-full">
          <Image src="/android-chrome-192x192.png" alt="Hügelfest Logo" width={48} height={48} />
        </div>
      </div>
      <main className="flex-1 pb-20">
        <MainContent
          mode={mode}
          activeTab={activeTab}
          adminActiveTab={adminActiveTab}
          handleTabChange={handleTabChange}
          timelineData={timelineData}
          infoBoardData={infoBoardData}
        />
      </main>
      <BottomBar
        mode={mode}
        activeTab={mode === 'admin' ? adminActiveTab : activeTab}
        onTabChange={handleTabChange}
        isAdminActive={mode === 'admin'}
        onAdminToggle={handleAdminToggle}
        showAdminButton={isAdmin}
      />
    </div>
  );
}
