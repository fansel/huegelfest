import { useState, useEffect, useRef } from 'react';
import { Announcement, GroupColors, ReactionType } from '@/lib/types';
import { loadAnnouncements, loadGroupColors, saveAnnouncements } from '@/lib/admin';

const REACTION_EMOJIS = {
  '👍': '👍',
  '❤️': '❤️',
  '😂': '😂',
  '😮': '😮',
  '😢': '😢',
  '🙏': '🙏'
};

export default function InfoBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const [deviceId, setDeviceId] = useState<string>('');
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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

  // Device ID initialisieren
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
    if (!isVisible) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const eventSource = new EventSource('/api/updates');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update') {
        const [loadedAnnouncements, loadedGroupColors] = await Promise.all([
          loadAnnouncements(),
          loadGroupColors()
        ]);
        setAnnouncements(loadedAnnouncements);
        setGroupColors(loadedGroupColors);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isVisible]);

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

  const handleReaction = async (announcementId: number, reactionType: ReactionType) => {
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
    await saveAnnouncements(updatedAnnouncements);
  };

  return (
    <div className="relative min-h-screen w-full">
      <div ref={boardRef} className="relative z-10 px-0 sm:px-6 w-full">
        <div className="space-y-2 sm:space-y-4 w-full">
        {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
        ) : (
          announcements.map((announcement) => {
            const groupColor = groupColors[announcement.group] || groupColors.default;
            return (
              <div
                key={announcement.id}
                className={`w-full p-4 sm:p-4 rounded-none sm:rounded-lg border ${
                  announcement.important 
                    ? 'border-2 shadow-lg transform hover:scale-[1.02] transition-transform' 
                    : 'border-opacity-30'
                }`}
                style={{
                    backgroundColor: `${groupColor}${announcement.important ? '25' : '20'}`,
                  borderColor: groupColor
                }}
              >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                      <span 
                          className="text-xs sm:text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full"
                          style={{ 
                            backgroundColor: `${groupColor}30`,
                            color: groupColor
                          }}
                      >
                        {announcement.group}
                      </span>
                      {announcement.important && (
                          <span className="text-xs sm:text-xs px-2 sm:px-2 py-1 sm:py-1 bg-red-200 text-red-600 rounded-full font-medium">
                            Wichtig
                          </span>
                      )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300">
                        {announcement.date} {announcement.time}
                      </div>
                    </div>
                    <p className="mt-3 text-base sm:text-base text-white whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
                        const reactionData = announcement.reactions?.[type] || { count: 0, deviceReactions: {} };
                        const hasReacted = reactionData.deviceReactions?.[deviceId]?.announcementId === announcement.id;
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
          })
        )}
        </div>
      </div>
    </div>
  );
} 