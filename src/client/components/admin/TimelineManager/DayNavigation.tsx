import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaCalendar, FaTimes } from 'react-icons/fa';
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
  const [showDayDetails, setShowDayDetails] = useState<number | null>(null);

  const handleDateChange = (index: number, dateString: string) => {
    const newDate = new Date(dateString);
    onUpdateDay(index, { date: newDate });
    setEditingDate(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {days.map((day, index) => (
          <div key={index} className="flex-1 min-w-[150px]">
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onDaySelect(index)}
                  className={`flex-1 text-left px-2 py-1 rounded transition-colors ${
                    currentDay === index
                      ? 'bg-[#ff9900] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm truncate">{day.title}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowDayDetails(index)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    title="Details anzeigen"
                  >
                    <FaCalendar size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={onAddDay}
          className="flex-1 min-w-[150px] p-2 rounded-lg bg-[#ff9900] text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <FaPlus size={14} />
          <span className="text-sm">Neuer Tag</span>
        </button>
      </div>

      {showDayDetails !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-[#460b6c]">
                {days[showDayDetails].title}
              </h3>
              <button
                onClick={() => setShowDayDetails(null)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {editingDay === showDayDetails ? (
                <input
                  type="text"
                  value={newDayTitle}
                  onChange={(e) => onNewDayTitleChange(e.target.value)}
                  onBlur={() => {
                    if (newDayTitle.trim()) {
                      onUpdateDay(showDayDetails, { title: newDayTitle });
                    }
                    onEditDay(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newDayTitle.trim()) {
                      onUpdateDay(showDayDetails, { title: newDayTitle });
                      onEditDay(null);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditDay(showDayDetails)}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                    title="Tag umbenennen"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => setEditingDate(showDayDetails)}
                    className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50 transition-colors"
                    title="Datum auswählen"
                  >
                    <FaCalendar size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteDay(showDayDetails)}
                    className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                    title="Tag löschen"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              )}
              {editingDate === showDayDetails && (
                <div>
                  <input
                    type="date"
                    value={days[showDayDetails].date ? new Date(days[showDayDetails].date).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateChange(showDayDetails, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20"
                    onBlur={() => setEditingDate(null)}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
