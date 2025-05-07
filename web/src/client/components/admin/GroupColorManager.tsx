import { useState, useEffect } from 'react';
import { GroupColors } from '@/types/types';
import { loadGroupColors } from '@/server/actions/admin';
import { FaTrash, FaPlus } from 'react-icons/fa';

interface GroupColorManagerProps {
  onSaveGroupColors: (colors: GroupColors) => void;
}

const generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function GroupColorManager({ onSaveGroupColors }: GroupColorManagerProps) {
  const [groups, setGroups] = useState<GroupColors>({ default: '#460b6c' });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(generateRandomColor());
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await loadGroupColors();
      setGroups(loadedGroups);
    };

    loadGroups();
  }, []);

  const handleAddGroup = async () => {
    if (newGroupName && !groups[newGroupName]) {
      const updatedGroups = { ...groups, [newGroupName]: newGroupColor };
      setGroups(updatedGroups);
      onSaveGroupColors(updatedGroups);
      setNewGroupName('');
      setNewGroupColor(generateRandomColor());
      setIsAddingGroup(false);
    }
  };

  const handleColorChange = async (group: string, color: string) => {
    const updatedGroups = { ...groups, [group]: color };
    setGroups(updatedGroups);
    onSaveGroupColors(updatedGroups);
  };

  const handleDelete = async (group: string) => {
    if (Object.keys(groups).length > 1) {
      const updatedGroups = { ...groups };
      delete updatedGroups[group];
      setGroups(updatedGroups);
      onSaveGroupColors(updatedGroups);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#460b6c]">
          Gruppenfarben
        </h3>
        <button
          onClick={() => {
            setIsAddingGroup(!isAddingGroup);
            if (!isAddingGroup) {
              setNewGroupColor(generateRandomColor());
            }
          }}
          className="p-2 text-[#ff9900] hover:text-[#ff9900]/80 transition-colors"
        >
          <FaPlus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {isAddingGroup && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Neue Gruppe"
                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={handleAddGroup}
                className="p-2 text-[#ff9900] hover:text-[#ff9900]/80 transition-colors"
              >
                <FaPlus size={20} />
              </button>
            </div>
          </div>
        )}

        {Object.entries(groups).map(
          ([group, color]) =>
            group !== 'default' && (
              <div
                key={`group-${group}`}
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(group, e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-lg text-gray-700 truncate block">
                      {group}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(group)}
                    className="p-2 text-red-600 hover:text-red-800 flex-shrink-0"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
