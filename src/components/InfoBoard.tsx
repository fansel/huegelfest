import { useState, useEffect, useRef } from 'react';
import { Announcement, GroupColors, REACTION_EMOJIS, ReactionType } from '@/lib/types';
import { loadAnnouncements, loadGroupColors } from '@/lib/admin';
import { saveAnnouncements as saveAnnouncementsServer } from '@/app/announcements/actions';

interface InfoBoardProps {
  isPWA?: boolean;
}

export default function InfoBoard({ isPWA = false }: InfoBoardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

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

      eventSource = new EventSource('/api/updates');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {};

      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'update') {
            const [loadedAnnouncements, loadedGroupColors] = await Promise.all([
              loadAnnouncements(),
              loadGroupColors()
            ]);
            setAnnouncements(loadedAnnouncements);
            setGroupColors(loadedGroupColors);
          }
        } catch (error) {}
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSourceRef.current = null;
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
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
    await saveAnnouncementsServer(updatedAnnouncements);

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAnnouncements),
      });
    } catch (error) {}
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
                className={`w-full p-4 sm:p-4 ${isPWA ? 'rounded-2xl' : 'rounded-none sm:rounded-lg'} border ${
                  announcement.important 
                    ? 'border-2 shadow-lg transform hover:scale-[1.02] transition-transform' 
                    : 'border-opacity-30'
                }`}
                style={{
                    backgroundColor: `${groupColor}${announcement.important ? (isPWA ? '40' : '25') : (isPWA ? '30' : '20')}`,
                  borderColor: groupColor
                }}
              >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                      <span 
                          className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-xs px-2 sm:px-2 py-1 sm:py-1 rounded-full`}
                          style={{ 
                            backgroundColor: `${groupColor}${isPWA ? '40' : '30'}`,
                            color: groupColor
                          }}
                      >
                        {announcement.group}
                      </span>
                      {announcement.important && (
                          <span className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-xs px-2 sm:px-2 py-1 sm:py-1 ${isPWA ? 'bg-red-300 text-red-700' : 'bg-red-200 text-red-600'} rounded-full font-medium`}>
                            Wichtig
                          </span>
                      )}
                      </div>
                      <div className={`${isPWA ? 'text-[10px]' : 'text-xs'} sm:text-sm text-gray-300`}>
                        {announcement.date} {announcement.time}
                      </div>
                    </div>
                    <p className={`mt-${isPWA ? '2' : '3'} ${isPWA ? 'text-sm' : 'text-base'} sm:text-base text-white whitespace-pre-wrap`}>
                      {announcement.content}
                    </p>
                    <div className={`mt-${isPWA ? '2' : '3'} flex items-center space-x-2`}>
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