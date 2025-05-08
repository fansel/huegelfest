import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Event, Category } from './types';

interface EventFormProps {
  onSubmit: (event: Omit<Event, '_id'>) => void;
  onCancel: () => void;
  categories: Category[];
  initialData?: Partial<Event>;
}

export default function EventForm({
  onSubmit,
  onCancel,
  categories,
  initialData,
}: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [time, setTime] = useState(initialData?.time || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || 'other');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein');
      return;
    }
    if (!time.trim()) {
      setError('Bitte gib eine Uhrzeit ein');
      return;
    }
    if (!description.trim()) {
      setError('Bitte gib eine Beschreibung ein');
      return;
    }
    onSubmit({
      title: title.trim(),
      time: time.trim(),
      description: description.trim(),
      categoryId: categoryId || 'other',
    });
  };

  const handleCancel = () => {
    setTitle('');
    setTime('');
    setDescription('');
    setCategoryId('other');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-[#460b6c]">
            {initialData ? 'Event bearbeiten' : 'Neues Event'}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
              placeholder="Event Titel"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Uhrzeit
            </label>
            <input
              type="text"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
              placeholder="z.B. 14:00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
              rows={3}
              placeholder="Event Beschreibung"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategorie
            </label>
            <select
              id="category"
              value={typeof categoryId === 'string' ? categoryId : categoryId.$oid}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ff9900] text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {initialData ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
