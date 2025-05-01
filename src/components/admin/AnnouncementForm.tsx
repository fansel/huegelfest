import { useState, useEffect, useCallback, memo } from 'react';
import { Announcement, GroupColors } from '@/lib/types';

interface AnnouncementFormProps {
  onSubmit: (announcement: Announcement) => void;
  initialData?: Announcement;
  groups: GroupColors;
}

const AnnouncementForm = memo(({ onSubmit, initialData, groups }: AnnouncementFormProps) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [group, setGroup] = useState(initialData?.group || Object.keys(groups).find(g => g !== 'default') || '');
  const [important, setImportant] = useState(initialData?.important || false);

  // Aktualisiere die Felder, wenn sich initialData ändert
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setGroup(initialData.group);
      setImportant(initialData.important);
    }
  }, [initialData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group || group === 'default') {
      alert('Bitte wählen Sie eine gültige Gruppe aus');
      return;
    }

    // Überprüfe auf doppelte Ankündigungen
    if (!initialData && content.trim() === '') {
      alert('Bitte geben Sie einen Inhalt ein');
      return;
    }

    const now = new Date();
    const newAnnouncement: Announcement = {
      id: initialData?.id || String(Date.now()),
      content: content.trim(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      author: group,
      group,
      important,
      reactions: initialData?.reactions || {}
    };

    onSubmit(newAnnouncement);
    
    // Nur zurücksetzen, wenn es keine initialData gibt (neue Ankündigung)
    if (!initialData) {
      setContent('');
      setGroup(Object.keys(groups).find(g => g !== 'default') || '');
      setImportant(false);
    }
  }, [content, group, important, initialData, onSubmit, groups]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setGroup(e.target.value);
  }, []);

  const handleImportantChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImportant(e.target.checked);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-3">{initialData ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}</h4>
      
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
            value={group}
            onChange={handleGroupChange}
            className="mt-1 block w-full rounded-md bg-white border border-gray-300 text-gray-700 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2 px-3"
            required
          >
            <option value="" className="bg-white">Bitte wählen...</option>
            {Object.keys(groups).map((groupName) => (
              groupName !== 'default' && (
                <option key={groupName} value={groupName} className="bg-white">
                  {groupName}
                </option>
              )
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
          className="w-full bg-[#ff9900] text-white py-3 px-4 rounded-md hover:bg-orange-600 text-sm font-medium transition-colors"
        >
          {initialData ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
});

AnnouncementForm.displayName = 'AnnouncementForm';

export default AnnouncementForm; 