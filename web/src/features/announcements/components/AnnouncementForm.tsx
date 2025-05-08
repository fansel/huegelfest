import { useState, useEffect } from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { GroupColors } from '@/shared/types/types';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface AnnouncementFormProps {
  announcement?: IAnnouncement;
  groups: GroupColors;
  onSave: (announcement: IAnnouncement) => Promise<void>;
  onCancel: () => void;
}

const AnnouncementForm = ({ announcement, groups, onSave, onCancel }: AnnouncementFormProps) => {
  const [content, setContent] = useState(announcement?.content || '');
  const [groupId, setGroupId] = useState(announcement?.groupId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (announcement) {
      setContent(announcement.content);
      setGroupId(announcement.groupId);
    }
  }, [announcement]);

  const handleSubmit = async () => {
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
        id: announcement?.id || '',
        content: content.trim(),
        groupId,
        groupName: '', // Wird serverseitig gesetzt
        groupColor: '', // Wird serverseitig gesetzt
        important: announcement?.important || false,
        reactions: {}, // Wird serverseitig gesetzt
        date: announcement?.date || '',
        time: announcement?.time || '',
        createdAt: announcement?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(announcementData);
      if (!announcement) {
        setContent('');
        setGroupId('');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast.error('Die Ankündigung konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#460b6c]">
          {announcement ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Gebe hier deine Ankündigung ein..."
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
            rows={3}
          />
        </div>

        <div>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-700"
          >
            <option value="">Wähle eine Gruppe</option>
            {Object.entries(groups)
              .filter(([id]) => id !== 'default')
              .map(([id, color]) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gespeichert...' : announcement ? 'Aktualisieren' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
