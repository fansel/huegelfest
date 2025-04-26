'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnnouncementForm from '@/components/admin/AnnouncementForm';
import GroupColorManager from '@/components/admin/GroupColorManager';
import MusicManager from '@/components/admin/MusicManager';
import TimelineManager from '@/components/admin/TimelineManager';
import { Announcement, GroupColors } from '@/lib/types';
import { loadAnnouncements, saveAnnouncements, loadMusicUrls, saveMusicUrls, loadGroupColors } from '@/lib/admin';

export default function AdminPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'announcements' | 'groups' | 'music' | 'timeline'>('announcements');
  const [musicUrls, setMusicUrls] = useState<string[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });

  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const isAuthenticated = cookies.some(cookie => 
        cookie.trim().startsWith('isAuthenticated=') && 
        cookie.trim().split('=')[1] === 'true'
      );

      if (!isAuthenticated) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      const [loadedAnnouncements, loadedMusicUrls, loadedGroupColors] = await Promise.all([
        loadAnnouncements(),
        loadMusicUrls(),
        loadGroupColors()
      ]);
      
      setAnnouncements(loadedAnnouncements);
      setMusicUrls(loadedMusicUrls);
      setGroupColors(loadedGroupColors);
    };

    loadData();
  }, []);

  const handleSaveAnnouncement = async (announcement: Announcement) => {
    let updatedAnnouncements: Announcement[];
    
    if (editingAnnouncement) {
      // Konvertiere IDs zu Zahlen für den Vergleich
      const editingId = typeof editingAnnouncement.id === 'string' 
        ? parseInt(editingAnnouncement.id, 10) 
        : editingAnnouncement.id;

      updatedAnnouncements = announcements.map(a => {
        const aId = typeof a.id === 'string' ? parseInt(a.id, 10) : a.id;
        return aId === editingId ? announcement : a;
      });
    } else {
      updatedAnnouncements = [...announcements, announcement];
    }
    
    setAnnouncements(updatedAnnouncements);
    await saveAnnouncements(updatedAnnouncements);
    setEditingAnnouncement(undefined);
  };

  const handleDeleteAnnouncement = async (id: number) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    await saveAnnouncements(updatedAnnouncements);
  };

  const handleSaveMusicUrls = async (urls: string[]) => {
    setMusicUrls(urls);
    await saveMusicUrls(urls);
  };

  const handleLogout = () => {
    document.cookie = 'isAuthenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#460b6c] p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-purple-200 mt-1">Verwalten Sie Ankündigungen, Gruppen und Musik</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-[#460b6c] text-[#460b6c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ankündigungen
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'groups'
                    ? 'border-[#460b6c] text-[#460b6c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gruppen
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'music'
                    ? 'border-[#460b6c] text-[#460b6c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Musik
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-[#460b6c] text-[#460b6c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Timeline
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingAnnouncement ? 'Ankündigung bearbeiten' : 'Neue Ankündigung erstellen'}
                  </h2>
                  <AnnouncementForm
                    initialData={editingAnnouncement}
                    onSubmit={handleSaveAnnouncement}
                    groups={groupColors}
                  />
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Bestehende Ankündigungen</h2>
                  {announcements.length === 0 ? (
                    <p className="text-gray-500">Keine Ankündigungen vorhanden</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-900">{announcement.content}</p>
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                <span>{announcement.date}</span>
                                <span>{announcement.time}</span>
                                <span className="font-medium">{announcement.author}</span>
                                <span className="font-medium">{announcement.group}</span>
                                {announcement.important && (
                                  <span className="text-red-600 font-medium">Wichtig</span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingAnnouncement(announcement)}
                                className="p-2 text-blue-600 hover:text-blue-800"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="p-2 text-red-600 hover:text-red-800"
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
              <GroupColorManager />
            )}
            {activeTab === 'music' && (
              <MusicManager musicUrls={musicUrls} onSave={handleSaveMusicUrls} />
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