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
    const updatedAnnouncements = editingAnnouncement
      ? announcements.map(a => a.id === announcement.id ? announcement : a)
      : [...announcements, announcement];
    
    setAnnouncements(updatedAnnouncements);
    await saveAnnouncements(updatedAnnouncements);
    setEditingAnnouncement(undefined);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    await saveAnnouncements(updatedAnnouncements);
  };

  const handleSaveMusicUrls = async (urls: string[]) => {
    setMusicUrls(urls);
    await saveMusicUrls(urls);
  };

  const handleSaveGroupColors = async (colors: GroupColors) => {
    setGroupColors(colors);
    await saveGroupColors(colors);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
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
          onEditAnnouncement={handleEditAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
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
          onEditAnnouncement={handleEditAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
        />
      )}
    </div>
  );
} 