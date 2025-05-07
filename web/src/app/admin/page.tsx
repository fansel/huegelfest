'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GroupColors } from '@/types/types';
import { IAnnouncement, IAnnouncementCreate } from '@/types/announcement';
import { loadAnnouncements, saveAnnouncements, loadMusicUrls, saveMusicUrls, loadGroupColors, saveGroupColors } from '@/server/actions/admin';
import DesktopAdminDashboard from '@/client/components/admin/DesktopAdminDashboard';
import MobileAdminDashboard from '@/client/components/admin/MobileAdminDashboard';
import { usePWA } from '@/contexts/PWAContext';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { isPWA, isMobile } = usePWA();
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [musicUrls, setMusicUrls] = useState<string[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try {
        setIsLoading(true);
        setError(null);
        
        // Lade zuerst die Gruppen, da sie für die Ankündigungen benötigt werden
        const loadedGroupColors = await loadGroupColors();
        setGroupColors(loadedGroupColors);
        
        // Dann lade die Ankündigungen und Musik-URLs parallel
        const [loadedAnnouncements, loadedMusicUrls] = await Promise.all([
          loadAnnouncements(),
          loadMusicUrls()
        ]);
        
        setAnnouncements(loadedAnnouncements);
        setMusicUrls(loadedMusicUrls);
      } catch (error) {
        console.error('[Admin] Fehler beim Laden der Daten:', error);
        setError(error instanceof Error ? error.message : 'Fehler beim Laden der Daten');
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveAnnouncements = async (announcements: IAnnouncement[]) => {
    try {
      console.log('[Admin] Speichere neue Ankündigungen...');
      await saveAnnouncements(announcements);
      
      // Lade die Ankündigungen neu, um die korrekten IDs zu erhalten
      const loadedAnnouncements = await loadAnnouncements();
      setAnnouncements(loadedAnnouncements);
      
      console.log('[Admin] Sende SSE-Update für neue Ankündigungen...');
      await fetch('/api/updates', { method: 'POST' });
      console.log('[Admin] SSE-Update erfolgreich gesendet');
      
      toast.success('Ankündigungen erfolgreich gespeichert');
    } catch (error) {
      console.error('[Admin] Fehler beim Speichern der Ankündigungen:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern der Ankündigungen');
    }
  };

  const handleSaveAnnouncement = async (announcement: IAnnouncement) => {
    try {
      if (!announcement.groupId) {
        throw new Error('Bitte wählen Sie eine Gruppe aus');
      }

      // Wenn es eine neue Ankündigung ist, füge sie zur Liste hinzu
      if (!announcement.id) {
        const newAnnouncements = [...announcements, announcement];
        await handleSaveAnnouncements(newAnnouncements);
      } else {
        // Wenn es eine bestehende Ankündigung ist, aktualisiere sie
        const updatedAnnouncements = announcements.map(a => 
          a.id === announcement.id ? { ...a, ...announcement } : a
        );
        await handleSaveAnnouncements(updatedAnnouncements);
      }
    } catch (error) {
      console.error('[Admin] Fehler beim Speichern der Ankündigung:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern der Ankündigung');
      throw error; // Re-throw für die Form-Komponente
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Fehler beim Löschen der Ankündigung');
      }

      if (!data.success) {
        throw new Error(data.message || 'Fehler beim Löschen der Ankündigung');
      }

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Ankündigung erfolgreich gelöscht');
      console.log('[Admin] Ankündigung erfolgreich gelöscht:', id);
    } catch (error) {
      console.error('[Admin] Fehler beim Löschen der Ankündigung:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Löschen der Ankündigung');
      // Don't re-throw the error, handle it here
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

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff9900] mx-auto"></div>
          <p className="mt-4 text-[#460b6c]">Lade Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Fehler!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {isPWA || isMobile ? (
        <MobileAdminDashboard
          announcements={announcements}
          onSaveAnnouncements={handleSaveAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          groups={groupColors}
          musicUrls={musicUrls}
          onSaveMusicUrls={handleSaveMusicUrls}
          onSaveGroupColors={handleSaveGroupColors}
        />
      ) : (
        <DesktopAdminDashboard
          announcements={announcements}
          onSaveAnnouncements={handleSaveAnnouncement}
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