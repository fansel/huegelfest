import { useState, useEffect } from 'react';
import { GroupColors } from '@/lib/types';
import { loadGroupColors } from '@/lib/admin';

interface GroupColorManagerProps {
  onSaveGroupColors: (colors: GroupColors) => Promise<void>;
}

export default function GroupColorManager({ onSaveGroupColors }: GroupColorManagerProps) {
  const [groups, setGroups] = useState<GroupColors>({ default: '#460b6c' });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#460b6c');

  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await loadGroupColors();
      setGroups(loadedGroups);
    };
    
    loadGroups();
  }, [onSaveGroupColors]);

  const handleAddGroup = async () => {
    if (newGroupName && !groups[newGroupName]) {
      const updatedGroups = { ...groups, [newGroupName]: newGroupColor };
      setGroups(updatedGroups);
      await onSaveGroupColors(updatedGroups);
      setNewGroupName('');
      setNewGroupColor('#460b6c');
    }
  };

  const handleColorChange = async (group: string, color: string) => {
    const updatedGroups = { ...groups, [group]: color };
    setGroups(updatedGroups);
    await onSaveGroupColors(updatedGroups);
  };

  const handleDelete = async (group: string) => {
    if (Object.keys(groups).length > 1) {
      const updatedGroups = { ...groups };
      delete updatedGroups[group];
      setGroups(updatedGroups);
      await onSaveGroupColors(updatedGroups);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold text-[#460b6c] mb-4">Gruppenfarben verwalten</h3>

      <div className="space-y-4">
        {Object.entries(groups).map(([group, color]) => (
          group !== 'default' && (
            <div key={`group-${group}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="font-medium text-sm sm:text-base text-gray-700">{group}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(group, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <button
                  onClick={() => handleDelete(group)}
                    className="p-2 text-red-600 hover:text-red-800 text-sm sm:text-base"
                >
                  Löschen
                </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-3">Neue Gruppe hinzufügen</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Gruppenname"
            className="flex-1 p-2 border border-gray-300 rounded text-sm sm:text-base bg-white text-gray-700 placeholder-gray-400"
          />
          <input
            type="color"
            value={newGroupColor}
            onChange={(e) => setNewGroupColor(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer"
          />
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 rounded bg-[#ff9900] text-white text-sm sm:text-base hover:bg-orange-600 transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
} 