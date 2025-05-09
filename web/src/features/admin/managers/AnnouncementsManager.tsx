'use client';
import React, { useState, useCallback } from 'react';
import { useAdminDashboard } from './../hooks/useAdminDashboard';
import toast from 'react-hot-toast';

interface AnnouncementFormState {
  id?: string;
  content: string;
  groupId: string;
  date: string;
  time: string;
  important: boolean;
}

const initialForm: AnnouncementFormState = {
  content: '',
  groupId: '',
  date: '',
  time: '',
  important: false,
};

const AnnouncementsManager: React.FC = () => {
  const {
    announcements,
    loadingAnnouncements,
    errorAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    groups, // später für groupId Auswahl
  } = useAdminDashboard();

  const [form, setForm] = useState<AnnouncementFormState>(initialForm);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;
    if (type === 'checkbox' && 'checked' in e.target) {
      fieldValue = (e.target as HTMLInputElement).checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) {
      toast.error('Inhalt darf nicht leer sein');
      return;
    }
    try {
      if (isEditing && form.id) {
        await updateAnnouncement(form.id, form);
        toast.success('Ankündigung aktualisiert');
      } else {
        await createAnnouncement({
          ...form,
          groupName: '', // Default, wird vom Backend ergänzt
          groupColor: '', // Default, wird vom Backend ergänzt
          reactions: {},
        });
        toast.success('Ankündigung erstellt');
      }
      setForm(initialForm);
      setIsEditing(false);
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleEdit = (a: typeof announcements[number]) => {
    setForm({
      id: a.id,
      content: a.content,
      groupId: a.groupId,
      date: a.date,
      time: a.time,
      important: a.important,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Ankündigung gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Ankündigungen</h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2 bg-gray-50 p-4 rounded">
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Ankündigungstext"
          className="w-full p-2 rounded border"
          rows={2}
        />
        {/* Gruppen-Auswahl (später dynamisch) */}
        <input
          name="groupId"
          value={form.groupId}
          onChange={handleChange}
          placeholder="Gruppen-ID (später Dropdown)"
          className="w-full p-2 rounded border"
        />
        <div className="flex gap-2">
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="p-2 rounded border"
          />
          <input
            name="time"
            type="time"
            value={form.time}
            onChange={handleChange}
            className="p-2 rounded border"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            name="important"
            type="checkbox"
            checked={form.important}
            onChange={handleChange}
          />
          Wichtig
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          disabled={loadingAnnouncements}
        >
          {isEditing ? 'Aktualisieren' : 'Erstellen'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="ml-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={() => { setForm(initialForm); setIsEditing(false); }}
          >
            Abbrechen
          </button>
        )}
      </form>
      {loadingAnnouncements && <div className="text-gray-500">Lade...</div>}
      {errorAnnouncements && <div className="text-red-500">{errorAnnouncements}</div>}
      <ul className="space-y-2">
        {announcements.map((a) => (
          <li key={a.id} className="bg-gray-100 rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-semibold">{a.content}</div>
              <div className="text-xs text-gray-500">{a.groupName} • {a.date} {a.time}</div>
              {a.important && <span className="text-xs text-red-500 font-bold ml-2">Wichtig</span>}
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleEdit(a)}
                disabled={loadingAnnouncements}
              >
                Bearbeiten
              </button>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDelete(a.id)}
                disabled={loadingAnnouncements}
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
      {announcements.length === 0 && !loadingAnnouncements && (
        <div className="text-gray-400">Keine Ankündigungen vorhanden</div>
      )}
    </div>
  );
};

export default AnnouncementsManager; 