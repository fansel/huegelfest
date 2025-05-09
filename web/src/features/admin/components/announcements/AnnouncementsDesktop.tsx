import React, { useState, useEffect } from 'react';
import { useAnnouncementsManager } from '../../hooks/useAnnouncementsManager';
import { IAnnouncement } from '@/shared/types/types';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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
                <div
                  key={announcement.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-2 relative transition-shadow hover:shadow-2xl"
                  style={{ borderLeft: `8px solid ${announcement.groupColor ?? '#ff9900'}` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500 font-medium">
                      {announcement.createdAt && !isNaN(new Date(announcement.createdAt).getTime())
                        ? dateFormatter.format(new Date(announcement.createdAt))
                        : ''}
                    </span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditing(announcement)}
                        className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-9 h-9 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                        aria-label="Bearbeiten"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-9 h-9 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                        aria-label="Löschen"
                        disabled={deletingId === announcement.id}
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block px-4 py-1 text-xs font-semibold rounded-full shadow-sm"
                      style={{ backgroundColor: announcement.groupColor ?? '#ff9900', color: '#fff' }}
                    >
                      {announcement.groupName ?? 'Gruppe'}
                    </span>
                    {announcement.important && (
                      <span className="inline-block px-4 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full shadow-sm">
                        Wichtig
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 text-base font-normal whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsDesktop; 