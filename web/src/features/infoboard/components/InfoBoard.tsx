'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { IAnnouncement, ReactionType, REACTION_EMOJIS } from '../../../shared/types/types';
import { getAllAnnouncementsAction } from '../../announcements/actions/getAllAnnouncements';
import { updateAnnouncementReactionsAction } from '../../announcements/actions/updateAnnouncementReactions';
import { getAnnouncementReactionsAction } from '../../announcements/actions/getAnnouncementReactions';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';

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
  const [reactionsMap, setReactionsMap] = useState<Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }>>({});
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // WebSocket-Integration: Live-Updates für Announcements
  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: (msg: WebSocketMessage) => {
        if (msg.topic === 'announcement') {
          // Neue Ankündigung empfangen: Announcements neu laden
          getAllAnnouncementsAction().then(loadedAnnouncements => {
            const mapped = loadedAnnouncements.map((a: any) => ({
              ...a,
              groupName: a.groupName ?? a.groupInfo?.name ?? '',
              groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
            }));
            setAnnouncements(mapped);
            saveAnnouncementsToCache(mapped);
          });
        }
        if (msg.topic === 'announcement-reaction') {
          // Reaktions-Update empfangen: Announcements und Reactions neu laden
          getAllAnnouncementsAction().then(async loadedAnnouncements => {
            const mapped = loadedAnnouncements.map((a: any) => ({
              ...a,
              groupName: a.groupName ?? a.groupInfo?.name ?? '',
              groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
            }));
            setAnnouncements(mapped);
            saveAnnouncementsToCache(mapped);
            // Reactions für alle Announcements neu laden
            const reactionsObj: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
            await Promise.all(mapped.map(async (a) => {
              reactionsObj[a.id] = await getAnnouncementReactionsAction(a.id, deviceId);
            }));
            setReactionsMap(reactionsObj);
          });
        }
      },
      onError: (err) => {
        console.error('[InfoBoard] WebSocket-Fehler:', err);
      },
      reconnectIntervalMs: 5000,
    }
  );

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
        // Lade Reactions für alle Announcements
        const reactionsObj: Record<string, { counts: Record<ReactionType, number>; userReaction?: ReactionType }> = {};
        await Promise.all(mapped.map(async (a) => {
          reactionsObj[a.id] = await getAnnouncementReactionsAction(a.id, deviceId);
        }));
        setReactionsMap(reactionsObj);
      } catch (error) {
        console.error('[InfoBoard] Fehler beim Laden der Daten:', error);
        setAnnouncements(loadAnnouncementsFromCache());
      }
    };
    loadData();
  }, [deviceId]);

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
      await updateAnnouncementReactionsAction(announcementId, type, deviceId);
      // Nach Server-Update: Reactions für dieses Announcement neu laden
      const newReactions = await getAnnouncementReactionsAction(announcementId, deviceId);
      setReactionsMap((prev) => ({ ...prev, [announcementId]: newReactions }));
    } catch (error) {
      console.error('[InfoBoard] Fehler beim Verarbeiten der Reaktion:', error);
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
                reactions={reactionsMap[announcement.id]}
                onReact={(type) => handleReaction(announcement.id, type)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 