import React from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

interface AnnouncementListMobileProps {
  announcements: IAnnouncement[];
  onEdit: (announcement?: IAnnouncement) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const AnnouncementListMobile: React.FC<AnnouncementListMobileProps> = ({ announcements, onEdit, onDelete, deletingId }) => {
  return (
    <div className="relative min-h-[60vh] pb-24">
      <div className="space-y-5 px-2 sm:px-0">
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-lg font-medium">Keine Ankündigungen vorhanden</p>
        ) : (
          [...announcements]
            .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
            .map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-[0_4px_24px_0_rgba(70,11,108,0.10)] border border-white/30 flex flex-col gap-3 relative transition-shadow hover:shadow-2xl"
                style={{ borderLeft: `8px solid ${announcement.groupColor ?? '#ff9900'}` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 font-medium">
                    {announcement.createdAt && !isNaN(new Date(announcement.createdAt).getTime())
                      ? dateFormatter.format(new Date(announcement.createdAt))
                      : ''}
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onEdit(announcement)}
                      className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-11 h-11 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                      aria-label="Bearbeiten"
                    >
                      <FaEdit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(announcement.id)}
                      className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-11 h-11 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                      aria-label="Löschen"
                      disabled={deletingId === announcement.id}
                    >
                      <FaTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block px-4 py-1 text-xs font-semibold rounded-full shadow-sm"
                    style={{ backgroundColor: announcement.groupColor ?? '#ff9900', color: '#fff' }}
                  >
                    {announcement.groupName ?? 'Gruppe'}
                  </span>
                  {announcement.important && (
                    <span className="inline-block px-4 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full shadow-sm">
                      Wichtig
                    </span>
                  )}
                </div>
                <p className="text-gray-900 text-lg font-normal whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>
              </div>
            ))
        )}
      </div>
      {/* Floating Action Button */}
      <button
        onClick={() => onEdit(undefined)}
        className="fixed bottom-20 right-6 z-50 bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white rounded-full shadow-3xl w-20 h-20 flex items-center justify-center text-4xl focus:outline-none focus:ring-4 focus:ring-[#ff9900]/30 active:scale-95 transition-transform duration-150 animate-fab-glow border-4 border-white"
        aria-label="Neue Ankündigung erstellen"
        style={{ boxShadow: '0 12px 36px 0 rgba(255,153,0,0.35), 0 4px 12px 0 rgba(70,11,108,0.10)' }}
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default AnnouncementListMobile; 