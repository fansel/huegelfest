'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { IAnnouncement, ReactionType, REACTION_EMOJIS } from '../../../shared/types/types';
import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { updateAnnouncementReactionsAction } from '../../announcements/actions/updateAnnouncementReactions';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';

const REACTION_TYPES: ReactionType[] = ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'];

interface InfoBoardProps {
  isPWA?: boolean;
  allowClipboard?: boolean;
}

interface Reaction {
  count: number;
  deviceReactions: Record<string, {
    type: ReactionType;
    announcementId: string;
  }>;
}

interface Reactions {
  thumbsUp: Reaction;
  clap: Reaction;
  laugh: Reaction;
  surprised: Reaction;
  heart: Reaction;
}

function saveAnnouncementsToCache(data: IAnnouncement[]) {
  try {
    localStorage.setItem('infoboardAnnouncements', JSON.stringify(data));
  } catch (e) {
    console.error('Fehler beim Speichern der InfoBoard-Daten im Cache:', e);
  }
}

function loadAnnouncementsFromCache(): IAnnouncement[] {
  try {
    const cached = localStorage.getItem('infoboardAnnouncements');
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Fehler beim Laden der InfoBoard-Daten aus dem Cache:', e);
    return [];
  }
}

export default function InfoBoard({ isPWA = false, allowClipboard = false }: InfoBoardProps) {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // Hilfsfunktion: Hex zu RGBA mit Validierung und Fallback
  const getBackgroundColor = (color: string, opacity: number): string => {
    // Hex-Format prüfen: #RRGGBB
    const isValidHex = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
    if (!isValidHex) {
      console.error(`[InfoBoard] Ungültiger Farbwert für getBackgroundColor: '${color}'. Fallback auf #cccccc.`);
      color = '#cccccc';
    }
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Hilfsfunktion: Datum formatieren
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === today.toDateString()) return 'Heute';
    if (dateObj.toDateString() === yesterday.toDateString()) return 'Gestern';
    return dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Hilfsfunktion: Emoji für Reaktion
  const getReactionEmoji = (type: ReactionType): string => REACTION_EMOJIS[type];

  // Initiale Daten laden
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedAnnouncements = await getAllAnnouncementsAction();
        const mapped = loadedAnnouncements.map((a: any) => ({
          ...a,
          groupName: a.groupName ?? a.groupInfo?.name ?? '',
          groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
        }));
        setAnnouncements(mapped);
        saveAnnouncementsToCache(mapped);
      } catch (error) {
        console.error('[InfoBoard] Fehler beim Laden der Daten:', error);
        // Fallback: aus LocalStorage laden
        setAnnouncements(loadAnnouncementsFromCache());
      }
    };
    loadData();
  }, []);

  // deviceId aus localStorage laden/erzeugen
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

  // Intersection Observer für Sichtbarkeit (optional für Effekte)
  useEffect(() => {
    const currentRef = boardRef.current;
    if (!currentRef) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(currentRef);
    return () => observer.unobserve(currentRef);
  }, []);

  // Reaktion-Handler mit Optimistic Update und Fehlerbehandlung
  const handleReaction = async (announcementId: string, type: ReactionType) => {
    try {
      if (!deviceId) return;
      setAnnouncements(prev => prev.map(announcement => {
        if (announcement.id !== announcementId) return announcement;
        const updatedReactions: Record<ReactionType, Reaction> = { ...(announcement.reactions as Record<ReactionType, Reaction>) };
        // Vorherige Reaktion entfernen
        Object.entries(updatedReactions).forEach(([reactionType, reaction]) => {
          if ((reaction as Reaction)?.deviceReactions?.[deviceId]) {
            const newDeviceReactions = { ...(reaction as Reaction).deviceReactions };
            delete newDeviceReactions[deviceId];
            updatedReactions[reactionType as ReactionType] = {
              ...(reaction as Reaction),
              deviceReactions: newDeviceReactions,
              count: Math.max(0, (reaction as Reaction).count - 1)
            };
          }
        });
        // Neue Reaktion hinzufügen
        const currentReaction = updatedReactions[type] || { count: 0, deviceReactions: {} };
        updatedReactions[type] = {
          ...currentReaction,
          deviceReactions: {
            ...currentReaction.deviceReactions,
            [deviceId]: { type, announcementId }
          },
          count: (currentReaction.count || 0) + 1
        };
        return { ...announcement, reactions: updatedReactions };
      }));
      // Server-Update
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement) return;
      let currentReactionType: ReactionType | null = null;
      Object.entries(announcement.reactions as Record<ReactionType, Reaction> || {}).forEach(([reactionType, reaction]) => {
        if (reaction?.deviceReactions?.[deviceId]) {
          currentReactionType = reactionType as ReactionType;
        }
      });
      // Wenn gleiche Reaktion nochmal: entfernen
      if (currentReactionType === type) {
        await updateAnnouncementReactionsAction(announcementId, announcement.reactions, deviceId);
      } else {
        if (currentReactionType) {
          await updateAnnouncementReactionsAction(announcementId, announcement.reactions, deviceId);
        }
        await updateAnnouncementReactionsAction(announcementId, announcement.reactions, deviceId);
      }
      // Nach Server-Update neu laden
      const updatedAnnouncements = await getAllAnnouncementsAction();
      setAnnouncements(
        updatedAnnouncements.map((a: any) => ({
          ...a,
          groupName: a.groupName ?? a.groupInfo?.name ?? '',
          groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
        }))
      );
    } catch (error) {
      console.error('[InfoBoard] Fehler beim Verarbeiten der Reaktion:', error);
      const updatedAnnouncements = await getAllAnnouncementsAction();
      setAnnouncements(
        updatedAnnouncements.map((a: any) => ({
          ...a,
          groupName: a.groupName ?? a.groupInfo?.name ?? '',
          groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
        }))
      );
    }
  };

  // UI-Rendering
  return (
    <div className="relative min-h-screen w-full">
      <div ref={boardRef} className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6 lg:mt-10">
        <div className="space-y-2 sm:space-y-4 w-full">
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                content={announcement.content}
                groupName={announcement.groupName ?? 'Gruppe'}
                groupColor={announcement.groupColor}
                important={announcement.important}
                createdAt={announcement.createdAt}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 