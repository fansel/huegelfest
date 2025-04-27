import { useState, useEffect } from 'react';
import { GroupColors } from '@/lib/types';
import { loadGroupColors, saveGroupColors } from '@/lib/admin';

export default function GroupColorManager() {
  const [groups, setGroups] = useState<GroupColors>({ default: '#460b6c' });
  const [newGroupName, setNewGroupName] = useState('');
  const [defaultGroup, setDefaultGroup] = useState<string>('');
  const [newGroupColor, setNewGroupColor] = useState('#460b6c');

  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await loadGroupColors();
      
      if (Object.keys(loadedGroups).length === 0) {
        const initialGroups: GroupColors = {
          default: '#460b6c',
          "Küche": "#ff9900",
          "Bar": "#ff9900",
          "Technik": "#ff9900",
          "Organisation": "#ff9900"
        };
        setGroups(initialGroups);
        await saveGroupColors(initialGroups);
        setDefaultGroup("Küche");
        localStorage.setItem('defaultGroup', "Küche");
      } else {
        setGroups(loadedGroups);
        setDefaultGroup(localStorage.getItem('defaultGroup') || Object.keys(loadedGroups)[0]);
      }
    };
    
    loadGroups();
  }, []);

  const handleAddGroup = async () => {
    if (newGroupName && !groups[newGroupName]) {
      const updatedGroups = { ...groups, [newGroupName]: newGroupColor };
      setGroups(updatedGroups);
      await saveGroupColors(updatedGroups);
      setNewGroupName('');
      setNewGroupColor('#460b6c');
    }
  };

  const handleColorChange = async (group: string, color: string) => {
    const updatedGroups = { ...groups, [group]: color };
    setGroups(updatedGroups);
    await saveGroupColors(updatedGroups);
  };

  const handleDelete = async (group: string) => {
    if (Object.keys(groups).length > 1) {
      const updatedGroups = { ...groups };
      delete updatedGroups[group];
      setGroups(updatedGroups);
      await saveGroupColors(updatedGroups);
      if (group === defaultGroup) {
        const newDefault = Object.keys(updatedGroups)[0];
        setDefaultGroup(newDefault);
        localStorage.setItem('defaultGroup', newDefault);
      }
    }
  };

  const handleSetDefault = (group: string) => {
    setDefaultGroup(group);
    localStorage.setItem('defaultGroup', group);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold text-[#460b6c] mb-4">Gruppenfarben verwalten</h3>

      <div className="space-y-4">
        {Object.entries(groups).map(([group, color]) => (
          group !== 'default' && (
            <div key={`group-${group}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 sm:p-4 bg-white rounded shadow">
              <div className="flex-1 w-full sm:w-auto">
                <span className="font-medium text-sm sm:text-base">{group}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(group, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <button
                  onClick={() => handleSetDefault(group)}
                  className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
                    defaultGroup === group
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {defaultGroup === group ? 'Standard' : 'Als Standard'}
                </button>
                <button
                  onClick={() => handleDelete(group)}
                  className="px-3 sm:px-4 py-2 rounded bg-red-500 text-white text-sm sm:text-base hover:bg-red-600"
                >
                  Löschen
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-3">Neue Gruppe hinzufügen</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Gruppenname"
            className="flex-1 p-2 border rounded text-sm sm:text-base"
          />
          <input
            type="color"
            value={newGroupColor}
            onChange={(e) => setNewGroupColor(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer"
          />
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 rounded bg-[#ff9900] text-white text-sm sm:text-base hover:bg-orange-600"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
} 