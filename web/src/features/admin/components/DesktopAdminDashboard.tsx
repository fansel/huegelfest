import { useState, useCallback } from 'react';
import { IAnnouncement } from '../../../shared/types/types';
import { GroupColors } from '../../../shared/types/types';
import AnnouncementForm from '../../../features/announcements/components/AnnouncementForm';
import GroupColorManager from '../../../features/groups/components/GroupColorManager';
import TimelineManager from '../../../features/timeline/components/TimelineManager';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { logout } from '@/features/auth/actions/logout';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface DesktopAdminDashboardProps {
  announcements: IAnnouncement[];
  onSaveAnnouncements: (announcement: IAnnouncement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => void;
  groups: GroupColors;
  onSaveGroupColors: (colors: GroupColors) => void;
  onLogout: () => Promise<void>;
}

const DesktopAdminDashboard = ({
  announcements,
  onSaveAnnouncements,
  onDeleteAnnouncement,
  groups,
  onSaveGroupColors,
  onLogout,
}: DesktopAdminDashboardProps) => {
  const [editingAnnouncement, setEditingAnnouncement] = useState<IAnnouncement | undefined>();
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'timeline'>('announcements');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const router = useRouter();
  

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Fehler beim Ausloggen:', error);
      setIsLoggingOut(false);
      toast.error('Beim Ausloggen ist ein Fehler aufgetreten. Bitte versuche es erneut.');
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
        toast.success(announcement.id ? 'Ankündigung wurde aktualisiert' : 'Ankündigung wurde erstellt');
      } catch (error) {
        console.error('Fehler beim Speichern der Ankündigung:', error);
        toast.error('Die Ankündigung konnte nicht gespeichert werden.');
        throw error;
      }
    },
    [groups, onSaveAnnouncements],
  );

  const handleSaveTimelineEvents = useCallback(async (events: TimelineEvent[]) => {
    try {
      setTimelineEvents(events);
      toast.success('Timeline wurde aktualisiert');
    } catch (error) {
      console.error('Fehler beim Speichern der Timeline:', error);
      toast.error('Die Timeline konnte nicht gespeichert werden.');
    }
  }, []);

  return (
    <div className="min-h-screen text-[#ff9900] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Header mit Logout-Button */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#ff9900]/20">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Wird ausgeloggt...</span>
                </>
              ) : (
                'Ausloggen'
              )}
            </button>
          </div>

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
                    key={`form-${editingAnnouncement?.id || 'new'}`}
                    announcement={editingAnnouncement}
                    groups={groups}
                    onSave={handleSaveAnnouncement}
                    onCancel={() => setEditingAnnouncement(undefined)}
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
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Timeline</h2>
                <TimelineManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopAdminDashboard;
