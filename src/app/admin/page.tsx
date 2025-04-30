'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Announcement, GroupColors } from '@/lib/types';
import { loadAnnouncements, saveAnnouncements, loadMusicUrls, saveMusicUrls, loadGroupColors, saveGroupColors } from '@/lib/admin';
import DesktopAdminDashboard from '@/components/admin/DesktopAdminDashboard';
import MobileAdminDashboard from '@/components/admin/MobileAdminDashboard';
import { usePWA } from '@/contexts/PWAContext';

export default function AdminPage() {
  const router = useRouter();
  const { isPWA, isMobile } = usePWA();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>(undefined);
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
    if (editingAnnouncement) {
      const updatedAnnouncements = announcements.map(a => a.id === announcement.id ? announcement : a);
      setAnnouncements(updatedAnnouncements);
      await saveAnnouncements(updatedAnnouncements);
    } else {
      const result = await addAnnouncement(announcement.content, announcement.group, announcement.important);
      if (result.success) {
        setAnnouncements(prev => [announcement, ...prev]);
      }
    }
    setEditingAnnouncement(undefined);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveMusicUrls = async (urls: string[]) => {
    setMusicUrls(urls);
    await saveMusicUrls(urls);
  };

  const handleSaveGroupColors = async (colors: GroupColors) => {
    setGroupColors(colors);
    await saveGroupColors(colors);
  };

  const addAnnouncement = async (content: string, group?: string, important?: boolean) => {
    try {
      // Verwende die ausgewählte Gruppe oder finde die erste verfügbare
      const selectedGroup = group || Object.keys(groupColors).find(g => g !== 'default');
      if (!selectedGroup) {
        throw new Error('Keine Gruppe verfügbar');
      }

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          group: selectedGroup,
          important: important || false
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen der Ankündigung');
      }

      return { success: true };
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Ankündigung:', error);
      return { success: false, error: 'Interner Serverfehler' };
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Ankündigung');
      }

      return { success: true };
    } catch (error) {
      console.error('Fehler beim Löschen der Ankündigung:', error);
      return { success: false, error: 'Interner Serverfehler' };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {isPWA || isMobile ? (
        <MobileAdminDashboard
          announcements={announcements}
          editingAnnouncement={editingAnnouncement}
          musicUrls={musicUrls}
          groupColors={groupColors}
          onSaveAnnouncement={handleSaveAnnouncement}
          onSaveMusicUrls={handleSaveMusicUrls}
          onSaveGroupColors={handleSaveGroupColors}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          setEditingAnnouncement={setEditingAnnouncement}
        />
      ) : (
        <DesktopAdminDashboard
          announcements={announcements}
          editingAnnouncement={editingAnnouncement}
          musicUrls={musicUrls}
          groupColors={groupColors}
          onSaveAnnouncement={handleSaveAnnouncement}
          onSaveMusicUrls={handleSaveMusicUrls}
          onSaveGroupColors={handleSaveGroupColors}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          setEditingAnnouncement={setEditingAnnouncement}
        />
      )}
    </div>
  );
} 