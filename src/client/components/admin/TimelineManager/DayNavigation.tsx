import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaCalendar } from 'react-icons/fa';
import { Day } from './types';

interface DayNavigationProps {
  days: Day[];
  currentDay: number;
  editingDay: number | null;
  newDayTitle: string;
  onDaySelect: (index: number) => void;
  onEditDay: (index: number) => void;
  onNewDayTitleChange: (title: string) => void;
  onDeleteDay: (index: number) => void;
  onAddDay: () => void;
  onUpdateDay: (index: number, updates: Partial<Day>) => void;
}

export default function DayNavigation({
  days,
  currentDay,
  editingDay,
  newDayTitle,
  onDaySelect,
  onEditDay,
  onNewDayTitleChange,
  onDeleteDay,
  onAddDay,
  onUpdateDay,
}: DayNavigationProps) {
  const [editingDate, setEditingDate] = useState<number | null>(null);

  const handleDateChange = (index: number, date: string) => {
    onUpdateDay(index, { date: new Date(date) });
    setEditingDate(null);
  };

  const handleEditEnd = (index: number) => {
    if (newDayTitle.trim()) {
      onUpdateDay(index, { title: newDayTitle });
    }
    onEditDay(-1);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day, index) => (
        <div key={index} className="flex items-center gap-2 relative">
          <button
            onClick={() => onDaySelect(index)}
            className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
              currentDay === index
                ? 'bg-[#460b6c] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {editingDay === index ? (
              <input
                type="text"
                value={newDayTitle}
                onChange={(e) => onNewDayTitleChange(e.target.value)}
                onBlur={() => handleEditEnd(index)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditEnd(index)}
                className="bg-transparent border-b border-white focus:outline-none"
                autoFocus
              />
            ) : (
              <>
                <div>{day.title}</div>
                {day.date && (
                  <div className="text-xs opacity-75">
                    {new Date(day.date).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </>
            )}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditDay(index)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Tag umbenennen"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => setEditingDate(index)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Datum auswählen"
            >
              <FaCalendar />
            </button>
            <button
              onClick={() => onDeleteDay(index)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Tag löschen"
            >
              <FaTrash />
            </button>
          </div>
          {editingDate === index && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white p-2 rounded-lg shadow-lg border border-gray-200">
              <input
                type="date"
                value={day.date ? new Date(day.date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
                onBlur={() => setEditingDate(null)}
                autoFocus
              />
            </div>
          )}
        </div>
      ))}
      <button
        onClick={onAddDay}
        className="px-3 sm:px-4 py-2 rounded bg-[#ff9900] text-white text-sm sm:text-base hover:bg-orange-600"
      >
        + Tag
      </button>
    </div>
  );
}
