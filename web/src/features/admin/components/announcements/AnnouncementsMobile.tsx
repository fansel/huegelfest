import React, { useState, useEffect } from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { useAnnouncementsManager } from '../../hooks/useAnnouncementsManager';
import { toast } from 'react-hot-toast';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const AnnouncementsMobile: React.FC = () => {
  const manager = useAnnouncementsManager();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<IAnnouncement> | undefined>(undefined);
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync form state when editing changes
  useEffect(() => {
    if (editing) {
      setContent(editing.content ?? '');
      setGroupId(editing.groupId ?? '');
    } else {
      setContent('');
      setGroupId('');
    }
  }, [editing, formOpen]);

  const handleEdit = (announcement?: IAnnouncement) => {
    setEditing(announcement);
    setFormOpen(true);
  };

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
      const announcementData: Partial<IAnnouncement> = {
        ...editing,
        content: content.trim(),
        groupId,
      };
      if (editing && editing.id) {
        await manager.updateAnnouncement(editing.id, announcementData);
        toast.success('Ankündigung wurde aktualisiert');
      } else {
        await manager.createAnnouncement({
          content: content.trim(),
          groupId,
          groupName: '', // Wird serverseitig gesetzt
          groupColor: '', // Wird serverseitig gesetzt
          important: editing?.important || false,
          reactions: {}, // Wird serverseitig gesetzt
          date: editing?.date || '',
          time: editing?.time || '',
        });
        toast.success('Ankündigung wurde erstellt');
      }
      setFormOpen(false);
      setEditing(undefined);
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

  return (
    <div className="relative min-h-[60vh] pb-24">
      {/* Plus-Button mittig über der Liste */}
      <div className="mt-6 flex justify-center mb-6">
        <button
          onClick={() => handleEdit(undefined)}
          className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
          aria-label="Neue Ankündigung erstellen"
        >
          <FaPlus className="h-5 w-5" />
        </button>
      </div>
      {/* Liste */}
      <div className="space-y-5 px-2 sm:px-0">
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
                onEdit={() => handleEdit(announcement)}
                onDelete={() => handleDelete(announcement.id)}
                isLoadingDelete={deletingId === announcement.id}
              />
            ))
        )}
      </div>

      {/* Bottom Sheet Formular */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/10 flex items-end justify-center">
          <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/80 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[85vh]">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
              <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-transparent">
              <span className="text-xl font-bold text-[#460b6c] tracking-tight">
                {editing?.id ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
              </span>
              <button
                onClick={() => { setFormOpen(false); setEditing(undefined); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
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
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => { setFormOpen(false); setEditing(undefined); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Wird gespeichert...' : editing?.id ? 'Aktualisieren' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @keyframes modern-sheet {
              0% { transform: translateY(100%) scale(0.98); opacity: 0.7; }
              80% { transform: translateY(-8px) scale(1.02); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .animate-modern-sheet {
              animation: modern-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsMobile; 