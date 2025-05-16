'use client';

import { useRef } from 'react';
import { IAnnouncement, ReactionType, REACTION_EMOJIS } from '../../../shared/types/types';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { getAnnouncementByIdAction } from '../../announcements/actions/getAnnouncementByIdAction';
import useSWR from 'swr';
import { updateAnnouncementReactionsAction } from '@/features/announcements/actions/updateAnnouncementReactions';
import { toast } from 'react-hot-toast';

const REACTION_TYPES: ReactionType[] = ['thumbsUp', 'clap', 'laugh', 'surprised', 'heart'];

function mapAnnouncement(a: any): IAnnouncement {
  return {
    ...a,
    groupName: a.groupName ?? a.groupInfo?.name ?? '',
    groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
    reactions: a.reactions ?? {},
  };
}

const fetcher = async () => {
  const data = await getAllAnnouncementsAction();
  return data.map(mapAnnouncement);
};

async function fetchAnnouncementById(id: string) {
  const data = await getAnnouncementByIdAction(id);
  return mapAnnouncement(data);
}

type InfoBoardProps = {
  announcements: IAnnouncement[];
  reactionsMap: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }>;
  allowClipboard?: boolean;
  deviceId: string;
};

export default function InfoBoard({ announcements: initialAnnouncements, allowClipboard = false, deviceId }: InfoBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  // SWR für Announcements
  const { data: announcements, mutate } = useSWR('announcements', fetcher, {
    fallbackData: initialAnnouncements,
    refreshInterval: 0,
  });

  useWebSocket(getWebSocketUrl(), {
    onMessage: async (msg: WebSocketMessage) => {
      if (msg.topic === 'announcement-created') {
        const newAnnouncement = await fetchAnnouncementById(msg.announcementId);
        mutate((current: IAnnouncement[] = []) => [newAnnouncement, ...current], false);
      } else if (msg.topic === 'announcement-updated') {
        const updated = await fetchAnnouncementById(msg.announcementId);
        mutate((current: IAnnouncement[] = []) =>
          current.map(a => a.id === updated.id ? updated : a), false
        );
      } else if (msg.topic === 'announcement-deleted') {
        mutate((current: IAnnouncement[] = []) =>
          current.filter(a => a.id !== msg.announcementId), false
        );
      } else if (msg.topic === 'announcement-reaction') {
        const updated = await fetchAnnouncementById(msg.announcementId);
        mutate((current: IAnnouncement[] = []) =>
          current.map(a => a.id === updated.id ? updated : a), false
        );
      }
    },
    onError: (err) => {
      console.error('[InfoBoard] WebSocket-Fehler:', err);
    },
    reconnectIntervalMs: 5000,
  });

  // Optimistisches Update für Reaktionen
  const handleReact = async (announcementId: string, type: ReactionType) => {
    if (!announcements) return;
    const prevAnnouncements = announcements;
    const idx = prevAnnouncements.findIndex(a => a.id === announcementId);
    if (idx === -1) return;
    const prev = prevAnnouncements[idx];
    const reactions = prev.reactions || { counts: {}, userReaction: undefined };
    const userReaction = reactions.userReaction;
    let newCounts = { ...reactions.counts };

    // Optimistisch updaten: Toggle-Logik
    if (userReaction === type) {
      newCounts[type] = (newCounts[type] || 1) - 1;
    } else {
      if (userReaction) newCounts[userReaction] = (newCounts[userReaction] || 1) - 1;
      newCounts[type] = (newCounts[type] || 0) + 1;
    }

    const optimisticAnnouncements = [
      ...prevAnnouncements.slice(0, idx),
      {
        ...prev,
        reactions: {
          ...reactions,
          counts: newCounts,
          userReaction: userReaction === type ? undefined : type,
        },
      },
      ...prevAnnouncements.slice(idx + 1),
    ];

    // 3. Optimistisch mutieren
    mutate(optimisticAnnouncements, false);

    // 4. Server-Request
    try {
      await updateAnnouncementReactionsAction(announcementId, type, deviceId);
      mutate(); // Synchronisiere mit Serverdaten
    } catch (err) {
      mutate(prevAnnouncements, false); // Rollback
      toast.error('Reaktion konnte nicht gespeichert werden.');
    }
  };

  // Hilfsfunktion: Hex zu RGBA mit Validierung und Fallback
  const getBackgroundColor = (color: string, opacity: number): string => {
    const isValidHex = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
    if (!isValidHex) {
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

  // UI-Rendering
  return (
    <div className="relative min-h-screen w-full">
      <div ref={boardRef} className="relative z-10 w-full px-2 sm:px-6 mt-4 sm:mt-6 lg:mt-10">
        <div className="space-y-2 sm:space-y-4 w-full">
          {!announcements || announcements.length === 0 ? (
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
                reactions={announcement.reactions}
                onReact={(type) => handleReact(announcement.id, type)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 