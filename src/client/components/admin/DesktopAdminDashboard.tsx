import { useState, useCallback } from 'react';
import { IAnnouncement } from '@/types/announcement';
import { GroupColors } from '@/types/types';
import AnnouncementForm from './AnnouncementForm';
import GroupColorManager from './GroupColorManager';
import MusicManager from '../MusicManager';
import TimelineManager from './TimelineManager';

interface DesktopAdminDashboardProps {
  announcements: IAnnouncement[];
  onSaveAnnouncements: (announcements: IAnnouncement[]) => void;
  onDeleteAnnouncement: (id: string) => void;
  groups: GroupColors;
  musicUrls: string[];
  onSaveMusicUrls: (urls: string[]) => void;
  onSaveGroupColors: (colors: GroupColors) => void;
}

const DesktopAdminDashboard = ({
  announcements,
  onSaveAnnouncements,
  onDeleteAnnouncement,
  groups,
  musicUrls,
  onSaveMusicUrls,
  onSaveGroupColors,
}: DesktopAdminDashboardProps) => {
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | undefined>();
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'music' | 'timeline'>('announcements');

  const handleSaveAnnouncement = useCallback(
    (announcement: IAnnouncement) => {
      const updatedAnnouncements = editingAnnouncement
        ? announcements.map((a) => (a.id === announcement.id ? announcement : a))
        : [...announcements, announcement];
      onSaveAnnouncements(updatedAnnouncements);
    },
    [announcements, editingAnnouncement, onSaveAnnouncements],
  );

  return (
    <div className="min-h-screen text-[#ff9900] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-[#ff9900]/20">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Ankündigungen
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'groups'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Gruppen
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'music'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Musik
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-3 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Timeline
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'announcements' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-[#460b6c] mb-4">Ankündigungen</h3>
                  <AnnouncementForm
                    onSubmit={handleSaveAnnouncement}
                    initialData={editingAnnouncement}
                    groups={groups}
                  />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-[#460b6c] mb-4">Aktuelle Ankündigungen</h3>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={`announcement-${announcement.id}`}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className="inline-block px-2 py-1 text-xs font-semibold rounded"
                            style={{ backgroundColor: announcement.groupColor }}
                          >
                            {announcement.groupId}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingAnnouncement(announcement)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => onDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-800">{announcement.content}</p>
                        {announcement.important && (
                          <span className="inline-block mt-2 text-xs font-semibold text-red-600">
                            Wichtig
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'groups' && (
              <GroupColorManager onSaveGroupColors={onSaveGroupColors} />
            )}
            {activeTab === 'music' && (
              <MusicManager musicUrls={musicUrls} onSaveMusicUrls={onSaveMusicUrls} />
            )}
            {activeTab === 'timeline' && (
              <TimelineManager />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopAdminDashboard;
