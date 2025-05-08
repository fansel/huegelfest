'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GroupColors, IAnnouncement } from '../../../shared/types/types';
import { getAllAnnouncementsAction } from '../../../features/announcements/actions/getAllAnnouncements';
import { getGroupColorsAction } from '../../groups/actions/getGroupColors';
import { saveGroupColorsAction } from '../../groups/actions/saveGroupColors';
import DesktopAdminDashboard from '../components/DesktopAdminDashboard';
import MobileAdminDashboard from '../components/MobileAdminDashboard';
import { usePWA } from '../../../contexts/PWAContext';
import { toast } from 'react-hot-toast';
import { saveAnnouncementsAction } from '@/features/announcements/actions/saveAnnouncementAction';

export default function AdminPage() {
  const router = useRouter();
  const { isPWA, isMobile } = usePWA();
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [groupColors, setGroupColors] = useState<GroupColors>({ default: '#460b6c' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Lade zuerst die Gruppen, da sie für die Ankündigungen benötigt werden
        const loadedGroupColors = await getGroupColorsAction();
        console.log('[Admin] Loaded group colors:', loadedGroupColors);
        setGroupColors(loadedGroupColors);
        
        // Dann lade die Ankündigungen
        const loadedAnnouncements = await getAllAnnouncementsAction();
        console.log('[Admin] Loaded announcements:', loadedAnnouncements);
        setAnnouncements(loadedAnnouncements);
        
        console.log('[Admin] Sende SSE-Update für neue Ankündigungen...');
        await fetch('/api/updates', { method: 'POST' });
        console.log('[Admin] SSE-Update erfolgreich gesendet');
        
        toast.success('Ankündigungen erfolgreich gespeichert');
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

  const handleLogout = async () => {
    // Cookie löschen (nur Beispiel, ggf. anpassen)
    document.cookie = 'isAuthenticated=; Max-Age=0; path=/;';
    router.push('/login');
  };

  const handleSaveAnnouncement = async (announcement: IAnnouncement) => {
    try {
      if (!announcement.groupId) {
        throw new Error('Bitte wählen Sie eine Gruppe aus');
      }
      // Speichere immer mit saveAnnouncementsAction
      const newAnnouncements = announcements.some(a => a.id === announcement.id)
        ? announcements.map(a => a.id === announcement.id ? { ...a, ...announcement } : a)
        : [...announcements, announcement];
      await saveAnnouncementsAction(newAnnouncements);
      setAnnouncements(newAnnouncements);
    } catch (error) {
      console.error('[Admin] Fehler beim Speichern der Ankündigung:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern der Ankündigung');
      throw error;
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

  const handleSaveGroupColors = async (colors: GroupColors) => {
    try {
      await saveGroupColorsAction(colors);
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
          onSaveGroupColors={handleSaveGroupColors}
        />
      ) : (
        <DesktopAdminDashboard
          announcements={announcements}
          onSaveAnnouncements={handleSaveAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          groups={groupColors}
          onSaveGroupColors={handleSaveGroupColors}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export async function logout() {
  const cookiesStore = cookies();
  cookiesStore.set('authToken', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
} 