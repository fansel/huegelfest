'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { deleteAnnouncementAction } from '@/features/announcements/actions/deleteAnnouncement';
import { saveAnnouncementsAction } from '@/features/announcements/actions/saveAnnouncementAction';
import { IAnnouncement } from '@/shared/types/types';
import AnnouncementForm from './AnnouncementForm';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);


  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      try {
        const data = await getAllAnnouncementsAction();
        setAnnouncements(
          data.map((a: any) => ({
            ...a,
            groupName: a.groupInfo?.name ?? '',
            groupColor: a.groupInfo?.color ?? '#ff9900',
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleSave = async (announcement: Partial<IAnnouncement>) => {
    setIsSubmitting(true);
    try {
      const updatedAnnouncements = [...announcements, {
        ...announcement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as IAnnouncement];
      await saveAnnouncementsAction(updatedAnnouncements);
      const data = await getAllAnnouncementsAction();
      setAnnouncements(
        data.map((a: any) => ({
          ...a,
          groupName: a.groupInfo?.name ?? '',
          groupColor: a.groupInfo?.color ?? '#ff9900',
        }))
      );
      setShowForm(false);
      toast.success('Ankündigung erfolgreich erstellt');
    } catch (err) {
      toast.error('Fehler beim Erstellen der Ankündigung');
      console.error('Fehler beim Erstellen der Ankündigung:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncementAction(id);
      const data = await getAllAnnouncementsAction();
      setAnnouncements(
        data.map((a: any) => ({
          ...a,
          groupName: a.groupInfo?.name ?? '',
          groupColor: a.groupInfo?.color ?? '#ff9900',
        }))
      );
      toast.success('Ankündigung erfolgreich gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen der Ankündigung');
      console.error('Fehler beim Löschen der Ankündigung:', err);
    }
  };

  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  console.log(announcements);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#460b6c]"></div>
      </div>
    );
  }

  if (error) {
    toast.error(`Fehler beim Laden der Ankündigungen: ${error.message}`);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#460b6c]">Neue Ankündigung</h3>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Schließen' : 'Neue Ankündigung'}
          </button>
        </div>
        {showForm && (
          <AnnouncementForm
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-[#460b6c] mb-4">Aktueller Ankündigungen</h3>
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keine Ankündigungen vorhanden</p>
          ) : (
            [...announcements]
              .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
              .map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative"
                  style={{
                    borderLeft: `4px solid ${announcement.groupColor ?? '#ff9900'}`
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span />
                    <span className="text-xs text-black whitespace-nowrap">
                      {announcement.createdAt}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className="inline-block px-2 py-1 text-xs font-semibold rounded"
                        style={{ backgroundColor: announcement.groupColor ?? '#ff9900' }}
                      >
                        {announcement.groupName ?? 'Gruppe'}
                      </span>
                      {announcement.important && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                          Wichtig
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                      aria-label="Ankündigung löschen"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{announcement.content}</p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
} 