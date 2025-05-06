import { useState, useEffect, useCallback, memo } from 'react';
import { GroupColors } from '@/types/types';
import { IAnnouncement, IAnnouncementCreate } from '@/types/announcement';

interface AnnouncementFormProps {
  onSubmit: (announcement: IAnnouncementCreate) => void;
  initialData?: IAnnouncement;
  groups: GroupColors;
}

const AnnouncementForm = memo(
  ({ onSubmit, initialData, groups }: AnnouncementFormProps) => {
    const [content, setContent] = useState(initialData?.content || '');
    const [selectedGroupId, setSelectedGroupId] = useState(() => {
      if (initialData?.groupName) {
        return initialData.groupName;
      }
      const availableGroups = Object.keys(groups).filter(g => g !== 'default');
      return availableGroups.length > 0 ? availableGroups[0] : '';
    });
    const [important, setImportant] = useState(initialData?.important || false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
      if (initialData) {
        setContent(initialData.content);
        setSelectedGroupId(initialData.groupName);
        setImportant(initialData.important || false);
      } else {
        // Reset form when initialData is undefined
        setContent('');
        const availableGroups = Object.keys(groups).filter(g => g !== 'default');
        setSelectedGroupId(availableGroups.length > 0 ? availableGroups[0] : '');
        setImportant(false);
      }
    }, [initialData, groups]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        if (!selectedGroupId || selectedGroupId === 'default') {
          setError('Bitte wählen Sie eine gültige Gruppe aus');
          setIsSubmitting(false);
          return;
        }

        if (!initialData && content.trim() === '') {
          setError('Bitte geben Sie einen Inhalt ein');
          setIsSubmitting(false);
          return;
        }

        const now = new Date();
        const newAnnouncement: IAnnouncementCreate = {
          content: content.trim(),
          groupId: selectedGroupId,
          important: important,
          createdAt: initialData?.createdAt || now,
          updatedAt: now,
          id: initialData?.id
        };

        try {
          await onSubmit(newAnnouncement);
          setSuccess(true);

          if (!initialData) {
            setContent('');
            const availableGroups = Object.keys(groups).filter(g => g !== 'default');
            setSelectedGroupId(availableGroups.length > 0 ? availableGroups[0] : '');
            setImportant(false);
          }

          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } catch (error) {
          console.error('Fehler beim Speichern:', error);
          setError('Fehler beim Speichern der Ankündigung');
        } finally {
          setIsSubmitting(false);
        }
      },
      [content, selectedGroupId, important, initialData, onSubmit, groups],
    );

    const handleContentChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
      },
      [],
    );

    const handleGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const newGroupId = e.target.value;
      console.log('Selected new group ID:', newGroupId);
      setSelectedGroupId(newGroupId);
    }, []);

    const handleImportantChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setImportant(e.target.checked);
      },
      [],
    );

    const availableGroups = Object.keys(groups).filter(g => g !== 'default');

    return (
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
      >
        <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-3">
          {initialData ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
        </h4>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Ankündigung erfolgreich {initialData ? 'aktualisiert' : 'erstellt'}!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inhalt</label>
            <textarea
              value={content}
              onChange={handleContentChange}
              className="mt-1 block w-full rounded-md bg-white border border-gray-300 text-gray-700 placeholder-gray-400 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] min-h-[100px] p-3"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gruppe</label>
            <select
              value={selectedGroupId}
              onChange={handleGroupChange}
              className="mt-1 block w-full rounded-md bg-white border border-gray-300 text-gray-700 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2 px-3"
              required
            >
              <option value="" className="bg-white">
                Bitte wählen...
              </option>
              {availableGroups.map((groupName) => (
                <option key={groupName} value={groupName} className="bg-white">
                  {groupName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="important"
              checked={important}
              onChange={handleImportantChange}
              className="h-4 w-4 text-[#ff9900] focus:ring-[#ff9900] border-gray-300 rounded bg-white"
            />
            <label htmlFor="important" className="ml-2 block text-sm text-gray-700">
              Wichtig
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-[#ff9900] text-white py-3 px-4 rounded-md hover:bg-orange-600 text-sm font-medium transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Wird gespeichert...' : initialData ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </form>
    );
  },
);

AnnouncementForm.displayName = 'AnnouncementForm';

export default AnnouncementForm;
