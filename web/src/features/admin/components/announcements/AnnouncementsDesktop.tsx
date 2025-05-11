import React, { useState, useEffect } from 'react';
import { useAnnouncementsManager } from '../../hooks/useAnnouncementsManager';
import { IAnnouncement } from '@/shared/types/types';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';

const AnnouncementsDesktop: React.FC = () => {
  const manager = useAnnouncementsManager();
  const [editing, setEditing] = useState<IAnnouncement | undefined>(undefined);
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync form state when editing changes
  useEffect(() => {
    if (editing) {
      setContent(editing.content);
      setGroupId(editing.groupId);
    } else {
      setContent('');
      setGroupId('');
    }
  }, [editing]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Bitte gib einen Inhalt ein.');
      return;
    }
    if (!groupId) {
      toast.error('Bitte wähle eine Gruppe aus.');
      return;
    }
    setIsSubmitting(true);
    try {
      const announcementData: IAnnouncement = {
        id: editing?.id || '',
        content: content.trim(),
        groupId,
        groupName: '', // Wird serverseitig gesetzt
        groupColor: '', // Wird serverseitig gesetzt
        important: editing?.important || false,
        reactions: {}, // Wird serverseitig gesetzt
        date: editing?.date || '',
        time: editing?.time || '',
        createdAt: editing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editing) {
        await manager.updateAnnouncement(announcementData.id, announcementData);
        toast.success('Ankündigung wurde aktualisiert');
      } else {
        await manager.createAnnouncement(announcementData);
        toast.success('Ankündigung wurde erstellt');
      }
      setEditing(undefined);
      setContent('');
      setGroupId('');
    } catch (error) {
      toast.error('Die Ankündigung konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await manager.deleteAnnouncement(id);
      toast.success('Ankündigung gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeletingId(null);
    }
  };

  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Formular */}
      <div className="bg-white p-6 rounded-lg shadow flex flex-col">
        <h3 className="text-lg font-bold text-[#460b6c] mb-4">
          {editing ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
        </h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Gebe hier deine Ankündigung ein..."
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400 mb-3"
          rows={3}
        />
        <select
          value={groupId}
          onChange={e => setGroupId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 mb-3"
        >
          <option value="">Wähle eine Gruppe</option>
          {manager.groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <div className="flex justify-end space-x-2 mt-auto">
          {editing && (
            <button
              onClick={() => setEditing(undefined)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gespeichert...' : editing ? 'Aktualisieren' : 'Speichern'}
          </button>
        </div>
      </div>
      {/* Liste */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-[#460b6c] mb-4">Aktuelle Ankündigungen</h3>
        <div className="space-y-4">
          {manager.announcements.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-lg font-medium">Keine Ankündigungen vorhanden</p>
          ) : (
            [...manager.announcements]
              .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
              .map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  content={announcement.content}
                  groupName={announcement.groupName ?? 'Gruppe'}
                  groupColor={announcement.groupColor}
                  important={announcement.important}
                  createdAt={announcement.createdAt}
                  onEdit={() => setEditing(announcement)}
                  onDelete={() => handleDelete(announcement.id)}
                  isLoadingDelete={deletingId === announcement.id}
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsDesktop; 