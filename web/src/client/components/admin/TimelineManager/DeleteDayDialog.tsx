import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface DeleteDayDialogProps {
  dayTitle: string;
  eventCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDayDialog({
  dayTitle,
  eventCount,
  onConfirm,
  onCancel,
}: DeleteDayDialogProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#460b6c]">Tag löschen</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          {eventCount > 0 ? (
            <>
              <p className="text-gray-700 mb-4">
                Dieser Tag enthält {eventCount} Event{eventCount > 1 ? 's' : ''}.
              </p>
              <p className="text-gray-700">
                Möchten Sie diesen Tag und alle zugehörigen Events wirklich löschen?
              </p>
            </>
          ) : (
            <p className="text-gray-700">Möchten Sie diesen Tag wirklich löschen?</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Löschen
          </button>
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
