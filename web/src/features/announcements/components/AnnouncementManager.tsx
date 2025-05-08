'use client';

import { useState } from 'react';
import { useAnnouncements } from '@/client/hooks/useAnnouncements';
import { useGroups } from '@/client/hooks/useGroups';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { IGroupDocument } from '@/database/models/Group';

export default function AnnouncementManager() {
  const { announcements, isLoading, error, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { groups } = useGroups();
  const [newAnnouncement, setNewAnnouncement] = useState({
    content: '',
    groupId: '',
    important: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.content.trim()) {
      toast.error('Bitte gib einen Inhalt ein.');
      return;
    }
    if (!newAnnouncement.groupId) {
      toast.error('Bitte wähle eine Gruppe aus.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnnouncement(newAnnouncement);
      toast.success('Ankündigung erfolgreich erstellt');
      setNewAnnouncement({
        content: '',
        groupId: '',
        important: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (err) {
      toast.error('Fehler beim Erstellen der Ankündigung');
      console.error('Fehler beim Erstellen der Ankündigung:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Ankündigung erfolgreich gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen der Ankündigung');
      console.error('Fehler beim Löschen der Ankündigung:', err);
    }
  };

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
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
              placeholder="Gebe hier deine Ankündigung ein..."
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
              rows={3}
            />
          </div>

          <div>
            <select
              value={newAnnouncement.groupId}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, groupId: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700"
            >
              <option value="">Wähle eine Gruppe</option>
              {Array.isArray(groups) && groups
                .filter((group: IGroupDocument) => group.name !== 'default')
                .map((group: IGroupDocument) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="important"
              type="checkbox"
              checked={newAnnouncement.important}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, important: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#460b6c] focus:ring-[#460b6c]"
            />
            <label htmlFor="important" className="ml-2 block text-sm text-gray-900">
              Wichtig
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-[#460b6c] mb-4">Aktuelle Ankündigungen</h3>
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keine Ankündigungen vorhanden</p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                style={{
                  borderLeft: `4px solid ${announcement.groupInfo.color}`
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="inline-block px-2 py-1 text-xs font-semibold rounded"
                      style={{ backgroundColor: announcement.groupInfo.color }}
                    >
                      {announcement.groupInfo.name}
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
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(announcement.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 