'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GroupColors } from '@/types/types';
import { IAnnouncement } from '@/types/announcement';
import { loadAnnouncements, saveAnnouncements, loadMusicUrls, saveMusicUrls, loadGroupColors, saveGroupColors } from '@/server/actions/admin';
import DesktopAdminDashboard from '@/client/components/admin/DesktopAdminDashboard';
import MobileAdminDashboard from '@/client/components/admin/MobileAdminDashboard';
import { usePWA } from '@/contexts/PWAContext';

export default function AdminPage() {
  const router = useRouter();
  const { isPWA, isMobile } = usePWA();
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
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

  const handleSaveAnnouncements = async (announcements: IAnnouncement[]) => {
    try {
      console.log('[Admin] Speichere neue Ankündigungen...');
      await saveAnnouncements(announcements);
      setAnnouncements(announcements);
      console.log('[Admin] Sende SSE-Update für neue Ankündigungen...');
      await fetch('/api/updates', { method: 'POST' });
      console.log('[Admin] SSE-Update erfolgreich gesendet');
    } catch (error) {
      console.error('[Admin] Fehler beim Speichern der Ankündigungen:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
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

      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen der Ankündigung:', error);
    }
  };

  const handleSaveMusicUrls = async (urls: string[]) => {
    try {
      await saveMusicUrls(urls);
      setMusicUrls(urls);
    } catch (error) {
      console.error('Fehler beim Speichern der Musik-URLs:', error);
    }
  };

  const handleSaveGroupColors = async (colors: GroupColors) => {
    try {
      await saveGroupColors(colors);
      setGroupColors(colors);
    } catch (error) {
      console.error('Fehler beim Speichern der Gruppenfarben:', error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {isPWA || isMobile ? (
        <MobileAdminDashboard
          announcements={announcements}
          onSaveAnnouncements={handleSaveAnnouncements}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          groups={groupColors}
          musicUrls={musicUrls}
          onSaveMusicUrls={handleSaveMusicUrls}
          onSaveGroupColors={handleSaveGroupColors}
        />
      ) : (
        <DesktopAdminDashboard
          announcements={announcements}
          onSaveAnnouncements={handleSaveAnnouncements}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          groups={groupColors}
          musicUrls={musicUrls}
          onSaveMusicUrls={handleSaveMusicUrls}
          onSaveGroupColors={handleSaveGroupColors}
        />
      )}
    </div>
  );
} 