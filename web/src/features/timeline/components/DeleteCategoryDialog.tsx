import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { DeletingCategory } from './types';

interface DeleteCategoryDialogProps {
  category: DeletingCategory;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteCategoryDialog({
  category,
  onConfirm,
  onCancel,
}: DeleteCategoryDialogProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#460b6c]">Kategorie löschen</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          {category.eventCount > 0 ? (
            <>
              <p className="text-gray-700 mb-4">
                Diese Kategorie wird in {category.eventCount} Event
                {category.eventCount > 1 ? 's' : ''} verwendet.
              </p>
              <p className="text-gray-700">
                Beim Löschen werden diese Events der Kategorie "Sonstiges" zugeordnet.
              </p>
            </>
          ) : (
            <p className="text-gray-700">Möchten Sie diese Kategorie wirklich löschen?</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
            data-testid="confirm-delete-category"
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
