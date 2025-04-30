import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface DayModalProps {
  onClose: () => void;
  onSave: (title: string, date: Date) => void;
  initialTitle?: string;
  initialDate?: Date;
}

export default function DayModal({ onClose, onSave, initialTitle = '', initialDate = new Date() }: DayModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [date, setDate] = useState(initialDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, date);
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#460b6c]">Tag bearbeiten</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel des Tages
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20 transition-colors"
              placeholder="z.B. Tag 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum
            </label>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20 transition-colors"
              required
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-[#ff9900] text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 