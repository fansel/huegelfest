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
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (boardRef.current) {
      observer.observe(boardRef.current);
    }

    return () => {
      if (boardRef.current) {
        observer.unobserve(boardRef.current);
      }
    };
  }, []);

  return (
    <div ref={boardRef} className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-[#460b6c] mb-6">Aktuelle Informationen</h2>
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center">Keine aktuellen Informationen</p>
        ) : (
          announcements.map((announcement) => {
            const groupColor = groupColors[announcement.group] || groupColors.default;
            return (
              <div
                key={announcement.id}
                className="border-l-4 p-4 rounded-r-lg transition-all duration-300 hover:shadow-md"
                style={{
                  borderLeftColor: groupColor,
                  borderColor: groupColor
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p 
                      className="text-gray-900"
                      style={{ color: groupColor }}
                    >
                      {announcement.content}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-500">{announcement.date}</span>
                      <span className="text-gray-500">{announcement.time}</span>
                      <span 
                        className="font-medium"
                        style={{ color: groupColor }}
                      >
                        {announcement.group}
                      </span>
                      {announcement.important && (
                        <span className="text-red-600 font-medium">Wichtig</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 