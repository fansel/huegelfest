import { useState, useEffect } from 'react';
import { Announcement, GroupColors } from '@/lib/types';
import { loadGroupColors, loadAnnouncements } from '@/lib/admin';

interface AnnouncementFormProps {
  onSubmit: (announcement: Announcement) => void;
  initialData?: Announcement;
}

export default function AnnouncementForm({ onSubmit, initialData }: AnnouncementFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [group, setGroup] = useState(initialData?.group || 'default');
  const [important, setImportant] = useState(initialData?.important || false);
  const [groups, setGroups] = useState<GroupColors>({ default: '#460b6c' });

  // Aktualisiere die Felder, wenn sich initialData ändert
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setGroup(initialData.group);
      setImportant(initialData.important);
    }
  }, [initialData]);

  // Lade die Gruppen und aktualisiere sie regelmäßig
  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await loadGroupColors();
      setGroups(loadedGroups);
    };
    
    loadGroups();
    // Aktualisiere alle 2 Sekunden
    const interval = setInterval(loadGroups, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let id = initialData?.id;
    if (!id) {
      const announcements = await loadAnnouncements();
      id = Math.max(...announcements.map(a => typeof a.id === 'string' ? parseInt(a.id, 10) : a.id), 0) + 1;
    }

    const newAnnouncement: Announcement = {
      id,
      content,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      author: 'Admin',
      group,
      important,
      reactions: initialData?.reactions || {}
    };

    onSubmit(newAnnouncement);
    
    // Nur zurücksetzen, wenn es keine initialData gibt (neue Ankündigung)
    if (!initialData) {
      setContent('');
      setGroup('default');
      setImportant(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Inhalt</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900]"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gruppe</label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900]"
        >
          {Object.keys(groups).map((groupName) => (
            groupName !== 'default' && (
              <option key={groupName} value={groupName}>
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
          onChange={(e) => setImportant(e.target.checked)}
          className="h-4 w-4 text-[#ff9900] focus:ring-[#ff9900] border-gray-300 rounded"
        />
        <label htmlFor="important" className="ml-2 block text-sm text-gray-700">
          Wichtig
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-[#ff9900] text-white py-2 px-4 rounded-md hover:bg-orange-600"
      >
        {initialData ? 'Aktualisieren' : 'Erstellen'}
      </button>
    </form>
  );
} 