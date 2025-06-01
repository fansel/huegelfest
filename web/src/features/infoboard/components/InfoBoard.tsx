'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { IAnnouncement, ReactionType, REACTION_EMOJIS } from '../../../shared/types/types';
import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { updateAnnouncementReactionsAction } from '../../announcements/actions/updateAnnouncementReactions';
import { getAnnouncementReactionsAction } from '../../announcements/actions/getAnnouncementReactions';
import AnnouncementEventCard from './AnnouncementEventCard';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import useSWR from 'swr';
import { useDeviceId } from '@/shared/hooks/useDeviceId';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const REACTION_TYPES: ReactionType[] = ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'];

interface InfoBoardProps {
  isPWA?: boolean;
  allowClipboard?: boolean;
  announcements?: IAnnouncement[];
  reactionsMap?: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }>;
}

interface Reaction {
  count: number;
  deviceReactions: Record<string, {
    type: ReactionType;
    announcementId: string;
  }>;
}


export default function InfoBoard({ isPWA = false, allowClipboard = false, announcements: initialAnnouncements = [], reactionsMap: initialReactionsMap = {} }: InfoBoardProps) {
  const deviceId = useDeviceId();
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isOnline = useNetworkStatus();

  // SWR für Announcements + Reactions
  const { data, mutate } = useSWR(
    ['infoboard', deviceId],
    async () => {
      if (!deviceId) return { announcements: initialAnnouncements, reactionsMap: initialReactionsMap };
      const loadedAnnouncements = await getAllAnnouncementsAction();
      const mapped = loadedAnnouncements.map((a: any) => ({
        ...a,
        groupName: a.groupName ?? a.groupInfo?.name ?? '',
        groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
      }));
      const reactionsObj: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
      await Promise.all(mapped.map(async (a) => {
        reactionsObj[a.id] = await getAnnouncementReactionsAction(a.id, deviceId);
      }));
      return { announcements: mapped, reactionsMap: reactionsObj };
    },
    {
      fallbackData: { announcements: initialAnnouncements, reactionsMap: initialReactionsMap },
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  );

  const announcements = data?.announcements || [];
  const reactionsMap = data?.reactionsMap || {};

  // WebSocket-Integration: Live-Updates für Announcements
  useGlobalWebSocket({
    topicFilter: ['announcement', 'announcement-reaction'],
    onMessage: (msg: WebSocketMessage) => {
      if (msg.topic === 'announcement' || msg.topic === 'announcement-reaction') {
        mutate(); // Daten neu laden
      }
    },
    onError: (err) => {
      console.error('[InfoBoard] WebSocket-Fehler:', err);
    },
  });

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
      if (!deviceId || !isOnline) return; // Offline: keine neuen Reaktionen möglich
      
      // Optimistic Update: Sofort UI aktualisieren
      const currentReactions = reactionsMap[announcementId] || { counts: {}, userReaction: undefined };
      const newReactions = { ...currentReactions };
      
      // Wenn User bereits diese Reaktion hat: entfernen
      if (currentReactions.userReaction === type) {
        newReactions.userReaction = undefined;
        newReactions.counts = { ...currentReactions.counts };
        newReactions.counts[type] = Math.max(0, (newReactions.counts[type] || 0) - 1);
      } 
      // Wenn User andere Reaktion hatte: alte entfernen, neue hinzufügen
      else if (currentReactions.userReaction) {
        const oldType = currentReactions.userReaction;
        newReactions.userReaction = type;
        newReactions.counts = { ...currentReactions.counts };
        newReactions.counts[oldType] = Math.max(0, (newReactions.counts[oldType] || 0) - 1);
        newReactions.counts[type] = (newReactions.counts[type] || 0) + 1;
      }
      // Neue Reaktion hinzufügen
      else {
        newReactions.userReaction = type;
        newReactions.counts = { ...currentReactions.counts };
        newReactions.counts[type] = (newReactions.counts[type] || 0) + 1;
      }
      
      // Optimistic Update im lokalen State
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            reactionsMap: {
              ...currentData.reactionsMap,
              [announcementId]: newReactions
            }
          };
        },
        false // Kein Revalidate
      );
      
      // Server-Update im Hintergrund
      await updateAnnouncementReactionsAction(announcementId, type, deviceId);
      
      // Nach Server-Update: Daten neu laden für Konsistenz
      mutate();
    } catch (error) {
      console.error('[InfoBoard] Fehler beim Verarbeiten der Reaktion:', error);
      // Bei Fehler: Daten neu laden um inkonsistenten State zu korrigieren
      mutate();
    }
  };

  // UI-Rendering
  return (
    <div ref={boardRef} className="w-full max-w-4xl mx-auto relative">
      <div className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6 lg:mt-10">
        <div className="space-y-2 sm:space-y-4 w-full">
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementEventCard
                key={announcement.id}
                content={announcement.content}
                groupName={announcement.groupName ?? 'Gruppe'}
                groupColor={announcement.groupColor}
                important={announcement.important}
                createdAt={announcement.createdAt}
                reactions={reactionsMap[announcement.id]}
                onReact={isOnline ? (type) => handleReaction(announcement.id, type) : undefined}
                isOffline={!isOnline}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 