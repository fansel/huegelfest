'use client';

import { useState, useEffect, useRef } from 'react';
import { GroupColors, REACTION_EMOJIS, ReactionType } from '@/types/types';
import { IAnnouncement } from '@/types/announcement';
import { loadAnnouncements, loadGroupColors } from '@/server/actions/admin';
import { ReactNode } from 'react';

interface InfoBoardProps {
  isPWA?: boolean;
  allowClipboard?: boolean;
}

interface Reaction {
  count: number;
  deviceReactions: {
    [key: string]: {
      type: ReactionType;
      announcementId: string;
    };
  };
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
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
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

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  // Lade initiale Daten
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
            const [loadedAnnouncements, loadedGroupColors] = await Promise.all([
              loadAnnouncements(),
              loadGroupColors()
            ]);
            setAnnouncements(loadedAnnouncements);
            setGroupColors(loadedGroupColors);
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

  const handleReaction = async (announcementId: string, reactionType: ReactionType) => {
    if (!deviceId) return;

    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement) return;

    // Initialisiere die Reaktionen mit der korrekten Struktur
    const currentReactions = (announcement.reactions || {
      thumbsUp: { count: 0, deviceReactions: {} },
      clap: { count: 0, deviceReactions: {} },
      laugh: { count: 0, deviceReactions: {} },
      surprised: { count: 0, deviceReactions: {} },
      heart: { count: 0, deviceReactions: {} }
    }) as unknown as Reactions;

    // Stelle sicher, dass alle Reaktionstypen existieren
    const updatedReactions: Reactions = {
      thumbsUp: { count: 0, deviceReactions: {} },
      clap: { count: 0, deviceReactions: {} },
      laugh: { count: 0, deviceReactions: {} },
      surprised: { count: 0, deviceReactions: {} },
      heart: { count: 0, deviceReactions: {} }
    };

    // Kopiere die bestehenden Reaktionen
    Object.keys(currentReactions).forEach(type => {
      if (currentReactions[type as keyof Reactions]) {
        updatedReactions[type as keyof Reactions] = {
          count: currentReactions[type as keyof Reactions].count || 0,
          deviceReactions: { ...currentReactions[type as keyof Reactions].deviceReactions }
        };
      }
    });

    const hasReacted = updatedReactions[reactionType]?.deviceReactions?.[deviceId];

    if (hasReacted) {
      // Entferne die Reaktion des Geräts
      delete updatedReactions[reactionType].deviceReactions[deviceId];
      updatedReactions[reactionType].count = Object.keys(updatedReactions[reactionType].deviceReactions).length;
    } else {
      // Entferne zuerst alle bestehenden Reaktionen des Geräts
      Object.keys(updatedReactions).forEach(type => {
        if (updatedReactions[type as keyof Reactions].deviceReactions[deviceId]) {
          delete updatedReactions[type as keyof Reactions].deviceReactions[deviceId];
          updatedReactions[type as keyof Reactions].count = Object.keys(updatedReactions[type as keyof Reactions].deviceReactions).length;
        }
      });

      // Füge die neue Reaktion hinzu
      updatedReactions[reactionType].deviceReactions[deviceId] = {
        type: reactionType,
        announcementId
      };
      updatedReactions[reactionType].count = Object.keys(updatedReactions[reactionType].deviceReactions).length;
    }

    try {
      const response = await fetch(`/api/announcements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: announcementId,
          reactions: updatedReactions,
          deviceId
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Reaktion');
      }

      const data = await response.json();

      // Aktualisiere den Zustand mit den Daten vom Server
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(a => 
          a.id === announcementId ? { ...a, reactions: data.reactions } : a
        )
      );
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Reaktion:', error);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      <div ref={boardRef} className="relative z-10 px-0 sm:px-6 w-full">
        <div className="space-y-2 sm:space-y-4 w-full">
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
          ) : (
            announcements.map((announcement) => {
              const groupColor = groupColors[announcement.groupId] || groupColors.default;
              return (
                <div
                  key={announcement.id}
                  className={`w-full p-4 sm:p-4 ${isPWA ? 'rounded-2xl' : 'rounded-none sm:rounded-lg'} border ${
                    announcement.important
                      ? 'border-2 shadow-lg transform hover:scale-[1.02] transition-transform'
                      : 'border-opacity-30'
                  }`}
                  style={{
                    backgroundColor: getBackgroundColor(groupColor, announcement.important ? (isPWA ? 0.4 : 0.25) : (isPWA ? 0.3 : 0.2)),
                    borderColor: groupColor
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full`}
                          style={{
                            backgroundColor: getBackgroundColor(groupColor, isPWA ? 0.4 : 0.3),
                            color: groupColor
                          }}
                        >
                          {announcement.groupId}
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
                    <div className={`mt-${isPWA ? '2' : '3'} flex items-center space-x-2`}>
                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                        const reactionData = announcement.reactions?.[type] || { count: 0, deviceReactions: {} };
                        const hasReacted = reactionData.deviceReactions?.[deviceId];
                        const count = reactionData.count || 0;

                        return (
                          <button
                            key={`reaction-${announcement.id}-${type}`}
                            onClick={() => handleReaction(announcement.id, type as ReactionType)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                              hasReacted
                                ? 'bg-white bg-opacity-20'
                                : 'hover:bg-white hover:bg-opacity-20'
                            }`}
                            style={{ color: groupColor }}
                          >
                            <span className="text-lg">{emoji}</span>
                            {count > 0 && (
                              <span className="text-xs">{count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
