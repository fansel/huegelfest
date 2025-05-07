'use client';

import { useState, useEffect, useRef } from 'react';
import { GroupColors, REACTION_EMOJIS, ReactionType } from '@/types/types';
import { IAnnouncement } from '@/types/announcement';
import { ReactNode } from 'react';
import { loadAnnouncements } from '@/server/actions/admin';
import { addReaction, removeReaction } from '@/server/actions/reactions';

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

export default function InfoBoard({ isPWA = false, allowClipboard = false }: InfoBoardProps) {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  const getBackgroundColor = (color: string, opacity: number) => {
    // Konvertiere Hex zu RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    } else {
      return dateObj.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const getReactionEmoji = (type: ReactionType): string => {
    const emojis: Record<ReactionType, string> = {
      thumbsUp: '👍',
      clap: '👏',
      laugh: '😂',
      surprised: '😮',
      heart: '❤️'
    };
    return emojis[type];
  };

  // Lade initiale Daten
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[InfoBoard] Lade Ankündigungen...');
        const loadedAnnouncements = await loadAnnouncements();
        console.log('[InfoBoard] Ankündigungen geladen:', loadedAnnouncements);
        setAnnouncements(loadedAnnouncements);
      } catch (error) {
        console.error('[InfoBoard] Fehler beim Laden der Daten:', error);
        setAnnouncements([]);
      }
    };

    loadData();
  }, []);

  // Lade deviceId
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

  // SSE für Updates
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      console.log('[SSE] Starte neue Verbindung...');
      eventSource = new EventSource('/api/updates');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Verbindung erfolgreich hergestellt');
      };

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Nachricht empfangen:', data);
          if (data.type === 'update') {
            console.log('[SSE] Update empfangen, lade neue Daten...');
            const loadedAnnouncements = await loadAnnouncements();
            console.log('[SSE] Neue Daten geladen:', loadedAnnouncements);
            setAnnouncements(loadedAnnouncements);
            console.log('[SSE] Daten erfolgreich aktualisiert');
          }
        } catch (error) {
          console.error('[SSE] Fehler beim Verarbeiten der Nachricht:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Verbindungsfehler:', error);
        eventSource?.close();
        eventSourceRef.current = null;
        console.log('[SSE] Versuche in 5 Sekunden erneut zu verbinden...');
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      console.log('[SSE] Cleanup: Schließe Verbindung...');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Intersection Observer für Sichtbarkeit
  useEffect(() => {
    const currentRef = boardRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  const handleReaction = async (announcementId: string, type: ReactionType) => {
    try {
      if (!deviceId) {
        console.error('[InfoBoard] Keine deviceId verfügbar');
        return;
      }

      // Optimistic Update
      setAnnouncements(prevAnnouncements => {
        return prevAnnouncements.map(announcement => {
          if (announcement.id !== announcementId) {
            return announcement;
          }

          // Erstelle eine tiefe Kopie der Reaktionen
          const updatedReactions = { ...announcement.reactions };
          
          // Entferne vorherige Reaktion
          Object.entries(updatedReactions).forEach(([reactionType, reaction]) => {
            if (reaction?.deviceReactions?.[deviceId]) {
              const newDeviceReactions = { ...reaction.deviceReactions };
              delete newDeviceReactions[deviceId];
              updatedReactions[reactionType as ReactionType] = {
                ...reaction,
                deviceReactions: newDeviceReactions,
                count: Math.max(0, reaction.count - 1)
              };
            }
          });

          // Füge neue Reaktion hinzu
          const currentReaction = updatedReactions[type] || {
            count: 0,
            deviceReactions: {}
          };

          updatedReactions[type] = {
            ...currentReaction,
            deviceReactions: {
              ...currentReaction.deviceReactions,
              [deviceId]: {
                type,
                announcementId
              }
            },
            count: (currentReaction.count || 0) + 1
          };

          return {
            ...announcement,
            reactions: updatedReactions
          };
        });
      });

      // Server Update
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement) {
        console.error('[InfoBoard] Ankündigung nicht gefunden:', announcementId);
        return;
      }

      // Finde die aktuelle Reaktion des Geräts
      let currentReactionType: ReactionType | null = null;
      Object.entries(announcement.reactions || {}).forEach(([reactionType, reaction]) => {
        if (reaction?.deviceReactions?.[deviceId]) {
          currentReactionType = reactionType as ReactionType;
        }
      });

      // Wenn die gleiche Reaktion nochmal geklickt wird, entferne sie
      if (currentReactionType === type) {
        console.log('[InfoBoard] Entferne Reaktion:', type);
        await removeReaction(announcementId, type, deviceId);
      } else {
        // Entferne vorherige Reaktion und füge neue hinzu
        if (currentReactionType) {
          console.log('[InfoBoard] Entferne vorherige Reaktion:', currentReactionType);
          await removeReaction(announcementId, currentReactionType, deviceId);
        }
        console.log('[InfoBoard] Füge neue Reaktion hinzu:', type);
        await addReaction(announcementId, type, deviceId);
      }

      // Lade die Ankündigungen neu
      console.log('[InfoBoard] Lade Ankündigungen neu...');
      const updatedAnnouncements = await loadAnnouncements();
      console.log('[InfoBoard] Neue Ankündigungen:', updatedAnnouncements);
      setAnnouncements(updatedAnnouncements);
    } catch (error) {
      console.error('[InfoBoard] Fehler beim Verarbeiten der Reaktion:', error);
      // Bei Fehler: Lade den aktuellen Stand neu
      const updatedAnnouncements = await loadAnnouncements();
      setAnnouncements(updatedAnnouncements);
    }
  };

  const createDefaultReactions = () => {
    const reactions: Record<ReactionType, Reaction> = {} as Record<ReactionType, Reaction>;
    
    REACTION_TYPES.forEach(type => {
      reactions[type] = {
        count: 0,
        deviceReactions: {}
      };
    });
    return reactions;
  };

  // Render die Ankündigungen
  return (
    <div className="relative min-h-screen w-full">
      <div ref={boardRef} className="relative z-10 px-0 sm:px-6 w-full">
        <div className="space-y-2 sm:space-y-4 w-full">
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`w-full p-4 sm:p-4 ${isPWA ? 'rounded-2xl' : 'rounded-none sm:rounded-lg'} border ${
                  announcement.important
                    ? 'border-2 shadow-lg transform hover:scale-[1.02] transition-transform'
                    : 'border-opacity-30'
                }`}
                style={{
                  backgroundColor: getBackgroundColor(announcement.groupColor, announcement.important ? (isPWA ? 0.4 : 0.25) : (isPWA ? 0.3 : 0.2)),
                  borderColor: announcement.groupColor
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full`}
                        style={{
                          backgroundColor: getBackgroundColor(announcement.groupColor, isPWA ? 0.4 : 0.3),
                          color: announcement.groupColor
                        }}
                      >
                        {announcement.groupName}
                      </span>
                      {announcement.important && (
                        <span className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-xs px-2 sm:px-2 py-1 sm:py-1 ${isPWA ? 'bg-red-300 text-red-700' : 'bg-red-200 text-red-600'} rounded-full font-medium`}>
                          Wichtig
                        </span>
                      )}
                    </div>
                    <div className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-sm text-gray-300 flex items-center space-x-2`}>
                      {formatDate(announcement.createdAt) === 'Heute' && (
                        <span className="bg-green-500 bg-opacity-20 text-green-300 px-2 py-1 rounded-full">
                          Heute
                        </span>
                      )}
                      <span>{announcement.time}</span>
                    </div>
                  </div>
                  <p className={`mt-${isPWA ? '2' : '3'} ${isPWA ? 'text-sm' : 'text-base'} sm:text-base text-white whitespace-pre-wrap`}>
                    {announcement.content}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {Object.entries(announcement.reactions || {}).map(([type, reaction]) => (
                      <button
                        key={type}
                        onClick={() => handleReaction(announcement.id, type as ReactionType)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                          reaction?.deviceReactions?.[deviceId]
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        <span>{getReactionEmoji(type as ReactionType)}</span>
                        {reaction?.count > 0 && <span>{reaction.count}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}