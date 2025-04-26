'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Announcement as AnnouncementType, GroupColors, REACTION_EMOJIS, ReactionType } from "@/lib/types";
import { loadAnnouncements, loadGroupColors, saveAnnouncements } from "@/lib/admin";
import SoundCloudPlayer from '@/components/SoundCloudPlayer';
import Countdown from '@/components/Countdown';
import Timeline from '@/components/Timeline';
import Starfield from '@/components/Starfield';
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const [deviceId, setDeviceId] = useState<string>('');

  // Lade Ankündigungen und Gruppenfarben beim Mounten
  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      const [loadedAnnouncements, loadedGroupColors] = await Promise.all([
        loadAnnouncements(),
        loadGroupColors()
      ]);
      setAnnouncements(loadedAnnouncements);
      setGroupColors(loadedGroupColors);
    };

    loadData();

    // Setze ein Intervall für regelmäßige Aktualisierungen
    const interval = setInterval(loadData, 5000); // Aktualisiere alle 5 Sekunden

    // Cleanup-Funktion
    return () => {
      clearInterval(interval);
      setMounted(false);
    };
  }, []);

  // Generiere oder lade deviceId beim Mounten
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

  // Sortiere Ankündigungen nach Datum und Uhrzeit (neueste zuerst)
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  const handleReaction = async (announcementId: number, reactionType: ReactionType) => {
    if (!deviceId) return;

    const updatedAnnouncements = announcements.map(announcement => {
      if (announcement.id === announcementId) {
        // Initialisiere reactions, falls nicht vorhanden
        const currentReactions = announcement.reactions || {};
        
        // Initialisiere die neue Reaktion
        const currentReaction = currentReactions[reactionType] || { 
          count: 0, 
          deviceReactions: {} 
        };
        
        // Prüfe, ob das Gerät bereits reagiert hat
        const previousReaction = Object.entries(currentReactions).find(
          ([, data]) => data.deviceReactions?.[deviceId]
        );

        // Wenn das Gerät bereits reagiert hat, entferne die alte Reaktion
        if (previousReaction) {
          const [prevType, prevData] = previousReaction;
          if (prevType !== reactionType) {
            prevData.count--;
            delete prevData.deviceReactions[deviceId];
          }
        }

        // Füge die neue Reaktion hinzu
        return {
          ...announcement,
          reactions: {
            ...currentReactions,
            [reactionType]: {
              count: previousReaction?.[0] === reactionType ? currentReaction.count : currentReaction.count + 1,
              deviceReactions: {
                ...(currentReaction.deviceReactions || {}),
                [deviceId]: reactionType
              }
            }
          }
        };
      }
      return announcement;
    });

    setAnnouncements(updatedAnnouncements);
    await saveAnnouncements(updatedAnnouncements);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#460b6c] text-[#ff9900] font-mono">
      <Starfield />
      <SoundCloudPlayer />

      {/* Content Wrapper */}
      <div className="relative z-20 flex flex-col items-center justify-start min-h-screen px-2 sm:px-6 py-4 sm:py-12 text-center">
        
        {/* Navigation - Mobile optimiert */}
        <nav className="fixed top-0 left-0 right-0 sm:absolute sm:top-20 flex justify-center space-x-2 sm:space-x-8 z-30 bg-[#460b6c] bg-opacity-50 backdrop-blur-sm p-2 sm:p-0 rounded-full mx-2 sm:mx-0">
          <a href="#infoboard" className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-2 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10">InfoBoard</a>
          <a href="#timeline" className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-2 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10">Timeline</a>
          <Link href="/anreise" className="text-[#ff9900] hover:text-orange-300 transition-colors text-xs sm:text-base px-2 sm:px-3 py-1 sm:py-2 rounded-full hover:bg-[#ff9900] hover:bg-opacity-10">
            Anreise
          </Link>
        </nav>

        {/* Logo - Links */}
        <div className="absolute top-12 sm:top-4 left-2 sm:left-4 w-[60px] sm:w-[150px] h-[50px] sm:h-[150px] z-40">
          <div className="relative w-full h-full">
            <Image
              src="/logo.jpg"
              alt="Hügelfest Logo"
              fill
              sizes="(max-width: 768px) 60px, 150px"
              className="object-contain animate-fade-in"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                objectFit: 'contain'
              }}
              priority
            />
          </div>
        </div>

        {/* Subtitle - Mobile optimiert */}
        <div className="absolute top-12 sm:top-4 right-2 sm:right-4 text-right">
          <h2 className="text-xs sm:text-xl sm:text-2xl tracking-widest animate-fade-in delay-200">
            31.07.2025 - 03.08.2025
          </h2>
          <Countdown />
        </div>

        {/* Main Content Sections - Mobile optimiert */}
        <div className="w-full max-w-4xl mx-auto mt-20 sm:mt-32 space-y-8 sm:space-y-16">
          {/* InfoBoard Section - Mobile optimiert */}
          <section id="infoboard" className="flex flex-col items-center justify-start px-2 sm:px-4">
            <div className="w-full max-w-2xl">
              <h2 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">InfoBoard</h2>
              <div className="space-y-3 sm:space-y-4">
                {sortedAnnouncements.map((announcement) => {
                  const groupColor = groupColors[announcement.group] || groupColors.default;
                  return (
                    <div 
                      key={`announcement-${announcement.id}`}
                      className={`p-3 sm:p-4 rounded-lg border ${
                        announcement.important 
                          ? 'border-2 shadow-lg transform hover:scale-[1.02] transition-transform' 
                          : 'border-opacity-30'
                      }`}
                      style={{
                        backgroundColor: `${groupColor}${announcement.important ? '15' : '10'}`,
                        borderColor: groupColor
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${groupColor}20`,
                                color: groupColor
                              }}
                            >
                              {announcement.group}
                            </span>
                            {announcement.important && (
                              <span 
                                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold"
                                style={{ 
                                  backgroundColor: '#ff000020',
                                  color: '#ff0000'
                                }}
                              >
                                WICHTIG
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-[10px] sm:text-xs" style={{ color: `${groupColor}70` }}>
                              {new Date(announcement.date).toLocaleDateString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-[10px] sm:text-xs" style={{ color: `${groupColor}70` }}>
                              {announcement.time}
                            </p>
                          </div>
                        </div>
                        <p 
                          className={`mt-1 text-sm sm:text-base ${
                            announcement.important ? 'font-semibold' : ''
                          }`}
                          style={{ color: announcement.important ? groupColor : 'white' }}
                        >
                          {announcement.content}
                        </p>
                        
                        {/* Reaktionen */}
                        <div className="mt-3 flex items-center space-x-2">
                          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                            const reactionData = announcement.reactions?.[type] || { count: 0, deviceReactions: {} };
                            const hasReacted = reactionData.deviceReactions?.[deviceId];
                            return (
                              <button
                                key={type}
                                onClick={() => handleReaction(announcement.id, type as ReactionType)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                                  hasReacted 
                                    ? 'bg-white bg-opacity-20' 
                                    : 'hover:bg-white hover:bg-opacity-20'
                                }`}
                                style={{ color: groupColor }}
                              >
                                <span className="text-lg">{emoji}</span>
                                {reactionData.count > 0 && (
                                  <span className="text-xs">{reactionData.count}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          <section id="timeline" className="flex flex-col items-center justify-start px-2 sm:px-4">
            <div className="w-full max-w-4xl">
              <Timeline />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
