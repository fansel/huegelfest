import { useState, useCallback } from 'react';
import { IAnnouncement, IAnnouncementCreate } from '@/types/announcement';
import { GroupColors } from '@/types/types';
import AnnouncementForm from './AnnouncementForm';
import GroupColorManager from './GroupColorManager';
import MusicManager from '../MusicManager';
import TimelineManager from './TimelineManager';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface MobileAdminDashboardProps {
  announcements: IAnnouncement[];
  onSaveAnnouncements: (announcement: IAnnouncement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => void;
  groups: GroupColors;
  musicUrls: string[];
  onSaveMusicUrls: (urls: string[]) => void;
  onSaveGroupColors: (colors: GroupColors) => void;
}

const MobileAdminDashboard = ({
  announcements,
  onSaveAnnouncements,
  onDeleteAnnouncement,
  groups,
  musicUrls,
  onSaveMusicUrls,
  onSaveGroupColors,
}: MobileAdminDashboardProps) => {
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | undefined>();
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'music' | 'timeline'>('announcements');
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Fehler beim Ausloggen:', error);
    }
  };

  const handleSaveAnnouncement = useCallback(
    async (announcement: IAnnouncementCreate) => {
      try {
        const fullAnnouncement: IAnnouncement = {
          ...announcement,
          id: announcement.id || '',
          groupName: groups[announcement.groupId] || announcement.groupId,
          groupColor: groups[announcement.groupId] || '#ff9900',
          reactions: {
            thumbsUp: { count: 0, deviceReactions: {} },
            clap: { count: 0, deviceReactions: {} },
            laugh: { count: 0, deviceReactions: {} },
            surprised: { count: 0, deviceReactions: {} },
            heart: { count: 0, deviceReactions: {} }
          }
        };

        await onSaveAnnouncements(fullAnnouncement);
        setEditingAnnouncement(undefined);
      } catch (error) {
        console.error('Fehler beim Speichern der Ankündigung:', error);
        throw error;
      }
    },
    [groups, onSaveAnnouncements],
  );

  return (
    <div className="min-h-screen text-[#ff9900] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Header mit Logout-Button */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#ff9900]/20">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
            >
              Ausloggen
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#ff9900]/20">
            <nav className="flex space-x-4 px-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'announcements'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Ankündigungen
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'groups'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Gruppen
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'music'
                    ? 'border-[#ff9900] text-[#ff9900]'
                    : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
                }`}
              >
                Musik
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
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
          <div className="p-4">
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold text-[#460b6c] mb-4">Ankündigungen</h3>
                  <AnnouncementForm
                    key={`form-${editingAnnouncement?.id || 'new'}`}
                    announcement={editingAnnouncement}
                    groups={groups}
                    onSave={handleSaveAnnouncement}
                    onCancel={() => setEditingAnnouncement(undefined)}
                  />
                </div>

                <div className="bg-white rounded-lg shadow p-4">
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
                            {announcement.groupName}
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

export default MobileAdminDashboard;
