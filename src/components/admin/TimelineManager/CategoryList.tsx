import React from 'react';
import { FaTrash } from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { Category } from './types';

interface CategoryListProps {
  categories: Category[];
  onDeleteClick: (value: string) => void;
}

export default function CategoryList({ categories, onDeleteClick }: CategoryListProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-4">Vorhandene Kategorien</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category._id}
            className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {React.createElement(Icons[category.icon as keyof typeof Icons], { className: "text-[#ff9900]" })}
              <span className={`text-sm ${category.isDefault ? 'font-bold' : 'font-medium'}`}>
                {category.label}
              </span>
            </div>
            {!category.isDefault && (
              <button
                onClick={() => onDeleteClick(category._id)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Kategorie löschen"
              >
                <FaTrash className="text-sm" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 