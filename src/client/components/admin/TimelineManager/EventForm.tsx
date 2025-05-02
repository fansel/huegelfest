import React from 'react';
import { Event } from '@/types/types';
import { Category } from './types';

interface EventFormProps {
  event: Omit<Event, 'id'>;
  categories: Category[];
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (event: Omit<Event, 'id'>) => void;
  onCancel: () => void;
  error: string | null;
}

export default function EventForm({
  event,
  categories,
  isEditing,
  onSubmit,
  onChange,
  onCancel,
  error,
}: EventFormProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-4">
        {isEditing ? 'Event bearbeiten' : 'Neues Event hinzufügen'}
      </h4>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4" role="form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Zeit</label>
            <input
              type="time"
              value={event.time}
              onChange={(e) => onChange({ ...event, time: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kategorie</label>
            <select
              value={event.categoryId}
              onChange={(e) => onChange({ ...event, categoryId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Titel</label>
          <input
            type="text"
            value={event.title}
            onChange={(e) => onChange({ ...event, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
          <textarea
            value={event.description}
            onChange={(e) => onChange({ ...event, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] min-h-[100px] sm:min-h-[150px]"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-[#ff9900] text-white py-2 px-4 rounded-md hover:bg-orange-600 text-sm sm:text-base font-medium"
          >
            {isEditing ? 'Aktualisieren' : 'Hinzufügen'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm sm:text-base font-medium"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
