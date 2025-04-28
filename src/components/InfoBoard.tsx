import { useState, useEffect, useRef } from 'react';
import { Announcement, GroupColors } from '@/lib/types';
import { loadAnnouncements, loadGroupColors } from '@/lib/admin';

export default function InfoBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
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

  return (
    <div className="relative min-h-screen">
      <div ref={boardRef} className="relative z-10 p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
        {announcements.length === 0 ? (
            <p className="text-gray-400 text-center">Keine aktuellen Informationen</p>
        ) : (
          announcements.map((announcement) => {
            const groupColor = groupColors[announcement.group] || groupColors.default;
            return (
              <div
                key={announcement.id}
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
                          <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-600 rounded-full">
                            Wichtig
                          </span>
                      )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400">
                        {announcement.date} {announcement.time}
                      </div>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-white whitespace-pre-wrap">
                      {announcement.content}
                    </p>
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