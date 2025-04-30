'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Announcement as AnnouncementType, GroupColors, REACTION_EMOJIS, ReactionType } from "@/lib/types";
import { loadAnnouncements, loadGroupColors } from "@/lib/admin";
import SoundCloudPlayer from '@/components/SoundCloudPlayer';
import Countdown from '@/components/Countdown';
import Timeline from '@/components/Timeline';
import Starfield from '@/components/Starfield';
import InfoBoard from '@/components/InfoBoard';
import { usePWA } from '@/contexts/PWAContext';
import { useRouter } from 'next/navigation';

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
 
  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    )
 
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])
 
  if (isStandalone) {
    return null
  }
 
  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon"> ⎋ </span>
          and then &ldquo;Add to Home Screen&rdquo;
          <span role="img" aria-label="plus icon"> ➕ </span>.
        </p>
      )}
    </div>
  )
}

export default function Home() {
  const router = useRouter();
  const { isPWA, isMobile } = usePWA();
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const [loadedAnnouncements, loadedGroupColors] = await Promise.all([
        loadAnnouncements(),
        loadGroupColors()
      ]);
      setAnnouncements(loadedAnnouncements);
      setGroupColors(loadedGroupColors);
    };
    loadData();

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('deviceId', newDeviceId);
      setDeviceId(newDeviceId);
    }
  }, []);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  const handleReaction = async (announcementId: string, reactionType: ReactionType) => {
    if (!deviceId) return;

    const updatedAnnouncements = announcements.map(announcement => {
      if (announcement.id === announcementId) {
        const currentReactions = announcement.reactions || {};
        const currentReaction = currentReactions[reactionType] || { 
          count: 0, 
          deviceReactions: {} 
        };
        
        const hasReacted = currentReaction.deviceReactions?.[deviceId]?.announcementId === announcementId;
        
        if (hasReacted) {
          const newReactions = { ...currentReactions };
          if (currentReaction.count <= 1) {
            delete newReactions[reactionType];
          } else {
            const updatedDeviceReactions = { ...currentReaction.deviceReactions };
            delete updatedDeviceReactions[deviceId];
            newReactions[reactionType] = {
              count: currentReaction.count - 1,
              deviceReactions: updatedDeviceReactions
            };
          }
          return {
            ...announcement,
            reactions: newReactions
          };
        }

        const cleanedReactions = { ...currentReactions };
        Object.keys(cleanedReactions).forEach(type => {
          if (type !== reactionType) {
            const deviceReactions = cleanedReactions[type].deviceReactions;
            if (deviceId in deviceReactions) {
              const updatedDeviceReactions = { ...deviceReactions };
              delete updatedDeviceReactions[deviceId];
              cleanedReactions[type] = {
                count: Object.keys(updatedDeviceReactions).length,
                deviceReactions: updatedDeviceReactions
              };
            }
          }
        });

        cleanedReactions[reactionType] = {
          count: (currentReaction.count || 0) + 1,
          deviceReactions: {
            ...currentReaction.deviceReactions,
            [deviceId]: {
              type: reactionType,
              announcementId: announcementId
            }
          }
        };

        return {
          ...announcement,
          reactions: cleanedReactions
        };
      }
      return announcement;
    });

    setAnnouncements(updatedAnnouncements);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#460b6c] text-[#ff9900] font-mono">
      <Starfield />
      <SoundCloudPlayer />

      <div className="relative z-20 flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-0 sm:py-12 text-center">
        <nav className="absolute top-0 left-0 right-0 z-40 flex justify-center space-x-1 sm:space-x-8 p-1 sm:p-0 rounded-full mx-1 sm:mx-0 pt-[env(safe-area-inset-top)]">
          <a href="#infoboard" className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-1.5 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10 backdrop-blur-sm">InfoBoard</a>
          <a href="#programm" className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-1.5 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10 backdrop-blur-sm">Programm</a>
        </nav>

        <div className="absolute top-[env(safe-area-inset-top)] left-4 w-[60px] sm:w-[150px] h-[50px] sm:h-[150px] z-50">
          <div className="relative w-full h-full">
            <Image
              src="/logo.jpg"
              alt="Hügelfest Logo"
              width={200}
              height={200}
              className="rounded-full hover:scale-105 transition-transform cursor-pointer"
            />
          </div>
        </div>

        <div className="absolute top-12 sm:top-4 right-2 sm:right-4 text-right">
          <h2 className="text-xs sm:text-xl sm:text-2xl tracking-widest animate-fade-in delay-200">
            31.07.2025 - 03.08.2025
          </h2>
          <Countdown />
        </div>

        <div className="w-full max-w-7xl mx-auto mt-20 sm:mt-32 space-y-8 sm:space-y-16">
          <section id="programm" className="flex flex-col items-center justify-start px-2 sm:px-4">
            <div className="w-full">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Programm</h2>
              <Timeline />
            </div>
          </section>

          <section id="infoboard" className="flex flex-col items-center justify-start px-2 sm:px-4">
            <div className="w-full">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">InfoBoard</h2>
              <InfoBoard isPWA={isPWA} />
            </div>
          </section>
        </div>
      </div>
      <InstallPrompt />
    </div>
  );
} 
