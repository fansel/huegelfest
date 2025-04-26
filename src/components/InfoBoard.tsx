import { useState, useEffect } from 'react';
import { Announcement, GroupColors } from '@/lib/types';
import { loadAnnouncements, loadGroupColors } from '@/lib/admin';

export default function InfoBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });

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
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
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