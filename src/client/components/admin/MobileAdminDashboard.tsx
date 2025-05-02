import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaMusic, FaImage, FaCalendar, FaUsers, FaCog } from 'react-icons/fa';
import AnnouncementForm from './AnnouncementForm';
import GroupColorManager from './GroupColorManager';
import MusicManager from '../MusicManager';
import TimelineManager from './TimelineManager/index';
import { GroupColors } from '@/types/types';
import { IAnnouncement } from '@/types/announcement';

interface MobileAdminDashboardProps {
  announcements: IAnnouncement[];
  editingAnnouncement: IAnnouncement | undefined;
  musicUrls: string[];
  groupColors: GroupColors;
  onSaveAnnouncements: (announcements: IAnnouncement[]) => Promise<void>;
  onSaveMusicUrls: (urls: string[]) => Promise<void>;
  onSaveGroupColors: (colors: GroupColors) => Promise<void>;
  setEditingAnnouncement: (announcement: IAnnouncement | undefined) => void;
}

export default function MobileAdminDashboard({
  announcements,
  editingAnnouncement,
  musicUrls,
  groupColors,
  onSaveAnnouncements,
  onSaveMusicUrls,
  onSaveGroupColors,
  setEditingAnnouncement,
}: MobileAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'announcements' | 'groups' | 'music' | 'timeline'
  >('announcements');
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  const handleSaveAnnouncement = async (announcement: IAnnouncement) => {
    const updatedAnnouncements = editingAnnouncement
      ? announcements.map((a) => (a.id === announcement.id ? announcement : a))
      : [announcement, ...announcements];
    await onSaveAnnouncements(updatedAnnouncements);
    setEditingAnnouncement(undefined);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updatedAnnouncements = announcements.filter((a) => a.id !== id);
    await onSaveAnnouncements(updatedAnnouncements);
  };

  const handleSaveMusic = (urls: string[]) => {
    onSaveMusicUrls(urls);
  };

  return (
    <div className="min-h-screen text-[#ff9900] p-4">
      <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Admin</h1>
            <p className="text-[#ff9900]/80 text-sm mt-1">
              Verwalten Sie Ankündigungen, Gruppen und Musik
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Abmelden
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#ff9900]/20">
          <nav className="flex space-x-4 px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-3 px-2 border-b-2 font-medium text-xs whitespace-nowrap ${
                activeTab === 'announcements'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
              }`}
            >
              Ankündigungen
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`py-3 px-2 border-b-2 font-medium text-xs whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
              }`}
            >
              Gruppen
            </button>
            <button
              onClick={() => setActiveTab('music')}
              className={`py-3 px-2 border-b-2 font-medium text-xs whitespace-nowrap ${
                activeTab === 'music'
                  ? 'border-[#ff9900] text-[#ff9900]'
                  : 'border-transparent text-[#ff9900]/60 hover:text-[#ff9900] hover:border-[#ff9900]/40'
              }`}
            >
              Musik
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-2 border-b-2 font-medium text-xs whitespace-nowrap ${
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
            <div className="space-y-4">
              <div className="bg-[#460b6c]/40 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">
                  {editingAnnouncement
                    ? 'Ankündigung bearbeiten'
                    : 'Neue Ankündigung erstellen'}
                </h2>
                <AnnouncementForm
                  initialData={editingAnnouncement}
                  onSubmit={handleSaveAnnouncement}
                  groups={groupColors}
                />
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Bestehende Ankündigungen</h2>
                {announcements.length === 0 ? (
                  <p className="text-[#ff9900]/60">Keine Ankündigungen vorhanden</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div
                        key={`announcement-${announcement.id}`}
                        className="bg-[#460b6c]/40 border border-[#ff9900]/20 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm">{announcement.content}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#ff9900]/80">
                              {announcement.important && (
                                <span className="text-red-400 font-medium">
                                  Wichtig
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingAnnouncement(announcement)}
                              className="p-1.5 text-[#ff9900] hover:text-[#ff9900]/80"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="p-1.5 text-red-400 hover:text-red-300"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'groups' && (
            <GroupColorManager onSaveGroupColors={onSaveGroupColors} />
          )}
          {activeTab === 'music' && <MusicManager />}
          {activeTab === 'timeline' && <TimelineManager />}
        </div>
      </div>
    </div>
  );
}
