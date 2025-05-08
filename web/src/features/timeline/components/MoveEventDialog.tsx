import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Day } from './types';

interface MoveEventDialogProps {
  days: Day[];
  currentDayIndex: number;
  onConfirm: (targetDayIndex: number) => void;
  onCancel: () => void;
}

export default function MoveEventDialog({
  days,
  currentDayIndex,
  onConfirm,
  onCancel,
}: MoveEventDialogProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#460b6c]">Event verschieben</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Wähle den Tag aus, zu dem das Event verschoben werden soll:
          </p>
          <div className="space-y-2">
            {days.map((day, index) => (
              <button
                key={day._id}
                onClick={() => onConfirm(index)}
                disabled={index === currentDayIndex}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  index === currentDayIndex
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#460b6c]/90'
                }`}
              >
                {day.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
