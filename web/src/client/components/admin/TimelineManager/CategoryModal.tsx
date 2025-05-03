import React, { useState } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { iconTranslations } from '@/client/lib/iconTranslations';
import { Category } from './types';

interface CategoryModalProps {
  onClose: () => void;
  onAddCategory: (category: Category) => void;
  onLoadCategories: () => void;
}

export default function CategoryModal({
  onClose,
  onAddCategory,
  onLoadCategories,
}: CategoryModalProps) {
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    icon: 'FaQuestion',
  });
  const [iconSearch, setIconSearch] = useState('');
  const [iconPage, setIconPage] = useState(0);
  const iconsPerPage = 48; // 8 Spalten * 6 Reihen

  // Filtere nur die Icons, die tatsächlich in react-icons/fa existieren
  const availableIcons = Object.entries(Icons)
    .filter(([name]) => name.startsWith('Fa'))
    .filter(([name]) => typeof Icons[name as keyof typeof Icons] === 'function');

  const allIcons = availableIcons
    .filter(([name]) => {
      if (!iconSearch) return true;
      const searchTerm = iconSearch.toLowerCase();
      const iconName = name.toLowerCase();
      const translation = iconTranslations[name]?.toLowerCase() || '';
      return iconName.includes(searchTerm) || translation.includes(searchTerm);
    })
    .sort(([a], [b]) => {
      const translationA = iconTranslations[a] || a;
      const translationB = iconTranslations[b] || b;
      return translationA.localeCompare(translationB);
    });

  const totalPages = Math.ceil(allIcons.length / iconsPerPage);
  const currentPageIcons = allIcons.slice(
    iconPage * iconsPerPage,
    (iconPage + 1) * iconsPerPage,
  );

  const handleIconSelect = (iconName: string) => {
    console.log('Icon ausgewählt:', iconName);
    setNewCategory(prev => ({ ...prev, icon: iconName }));
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.icon || newCategory.icon === 'FaQuestion') {
        alert('Bitte wählen Sie ein Icon aus.');
        return;
      }

      if (!newCategory.name.trim()) {
        alert('Bitte geben Sie einen Namen für die Kategorie ein.');
        return;
      }

      await onAddCategory(newCategory);
      await onLoadCategories();
      onClose();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      alert(
        'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#460b6c]">Icon auswählen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {newCategory.icon !== 'FaQuestion' && (
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
              <div className="text-3xl text-[#ff9900]">
                {React.createElement(Icons[newCategory.icon as keyof typeof Icons])}
              </div>
              <div>
                <h4 className="text-lg font-medium text-[#460b6c]">
                  {iconTranslations[newCategory.icon] ||
                    newCategory.icon.replace('Fa', '')}
                </h4>
                <p className="text-sm text-gray-600">Wird als Kategorie verwendet</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name der Kategorie
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20 transition-colors"
                placeholder="z.B. Workshop"
              />
            </div>
          </div>
        )}

        <div className="relative">
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => {
                  setIconSearch(e.target.value);
                  setIconPage(0);
                }}
                placeholder="Icon suchen (Name oder Übersetzung)..."
                className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 focus:border-[#ff9900] focus:ring-2 focus:ring-[#ff9900]/20 transition-colors"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FaSearch />
              </div>
            </div>
            {iconSearch && (
              <p className="mt-2 text-sm text-gray-600">
                {allIcons.length} Icons gefunden
              </p>
            )}
          </div>

          <div className="grid grid-cols-8 gap-2 max-h-[60vh] overflow-y-auto p-2 bg-gray-50 rounded-lg">
            {currentPageIcons.map(([name, Icon]) => (
              <button
                key={name}
                onClick={() => handleIconSelect(name)}
                className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                  newCategory.icon === name
                    ? 'bg-[#ff9900] text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
                title={`${iconTranslations[name] || name.replace('Fa', '')} (${name})`}
              >
                <Icon className="text-2xl" />
                <span className="text-xs truncate w-full text-center">
                  {iconTranslations[name] || name.replace('Fa', '')}
                </span>
              </button>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setIconPage(Math.max(0, iconPage - 1))}
            disabled={iconPage === 0}
            className={`px-4 py-2 rounded-lg ${
              iconPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#ff9900] text-white hover:bg-orange-600'
            } transition-colors`}
          >
            Zurück
          </button>
          <span className="text-sm text-gray-600">
            Seite {iconPage + 1} von {totalPages}
          </span>
          <button
            onClick={() => setIconPage(Math.min(totalPages - 1, iconPage + 1))}
            disabled={iconPage === totalPages - 1}
            className={`px-4 py-2 rounded-lg ${
              iconPage === totalPages - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#ff9900] text-white hover:bg-orange-600'
            } transition-colors`}
          >
            Weiter
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddCategory}
            className="flex-1 bg-[#ff9900] text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !newCategory.icon ||
              newCategory.icon === 'FaQuestion' ||
              !newCategory.name.trim()
            }
          >
            Hinzufügen
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
