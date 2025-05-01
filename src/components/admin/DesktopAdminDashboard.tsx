import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AnnouncementForm from './AnnouncementForm';
import GroupColorManager from './GroupColorManager';
import MusicManager from '../MusicManager';
import TimelineManager from './TimelineManager/index';
import { Announcement, GroupColors } from '@/lib/types';

interface DesktopAdminDashboardProps {
  announcements: Announcement[];
  editingAnnouncement: Announcement | undefined;
  musicUrls: string[];
  groupColors: GroupColors;
  onSaveAnnouncement: (announcement: Announcement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onSaveMusicUrls: (urls: string[]) => Promise<void>;
  onSaveGroupColors: (colors: GroupColors) => Promise<void>;
  setEditingAnnouncement: (announcement: Announcement | undefined) => void;
}

export default function DesktopAdminDashboard({
  announcements,
  editingAnnouncement,
  musicUrls,
  groupColors,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onSaveMusicUrls,
  onSaveGroupColors,
  setEditingAnnouncement,
}: DesktopAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'music' | 'timeline'>('announcements');
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  };

  return (
    <div className="min-h-screen text-[#ff9900] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#460b6c]/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-[#ff9900]/80 mt-2">Verwalten Sie Ankündigungen, Gruppen und Musik</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Abmelden
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#460b6c]/40 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">
                    {editingAnnouncement ? 'Ankündigung bearbeiten' : 'Neue Ankündigung erstellen'}
                  </h2>
                  <AnnouncementForm
                    initialData={editingAnnouncement}
                    onSubmit={onSaveAnnouncement}
                    groups={groupColors}
                  />
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Bestehende Ankündigungen</h2>
                  {announcements.length === 0 ? (
                    <p className="text-[#ff9900]/60">Keine Ankündigungen vorhanden</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="bg-[#460b6c]/40 border border-[#ff9900]/20 rounded-lg p-4 hover:bg-[#460b6c]/60 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="text-base">{announcement.content}</p>
                              <div className="mt-2 flex items-center gap-4 text-sm text-[#ff9900]/80">
                                <span>{announcement.date}</span>
                                <span>{announcement.time}</span>
                                <span className="font-medium">{announcement.author}</span>
                                <span className="font-medium">{announcement.group}</span>
                                {announcement.important && (
                                  <span className="text-red-400 font-medium">Wichtig</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingAnnouncement(announcement)}
                                className="p-2 text-[#ff9900] hover:text-[#ff9900]/80"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => onDeleteAnnouncement(announcement.id)}
                                className="p-2 text-red-400 hover:text-red-300"
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
            {activeTab === 'music' && (
              <MusicManager musicUrls={musicUrls} onSave={onSaveMusicUrls} />
            )}
            {activeTab === 'timeline' && (
              <TimelineManager />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 