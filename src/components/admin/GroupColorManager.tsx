import { useState, useEffect } from 'react';
import { GroupColors } from '@/lib/types';
import { loadGroupColors, saveGroupColors, updateGroupColor, renameGroup, deleteGroup } from '@/lib/admin';

export default function GroupColorManager() {
  const [groups, setGroups] = useState<GroupColors>({ default: '#460b6c' });
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [defaultGroup, setDefaultGroup] = useState<string>('');

  useEffect(() => {
    const loadGroups = async () => {
      const loadedGroups = await loadGroupColors();
      
      // Wenn keine Gruppen existieren, erstelle die Standardgruppen
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
      const updatedGroups = { ...groups, [newGroupName]: '#460b6c' };
      setGroups(updatedGroups);
      await saveGroupColors(updatedGroups);
      setNewGroupName('');
    }
  };

  const handleColorChange = async (group: string, color: string) => {
    const updatedGroups = { ...groups, [group]: color };
    setGroups(updatedGroups);
    await saveGroupColors(updatedGroups);
  };

  const handleRenameStart = (group: string) => {
    setEditingGroup(group);
    setNewName(group);
  };

  const handleRename = async () => {
    if (editingGroup && newName && newName !== editingGroup) {
      const updatedGroups = { ...groups };
      delete updatedGroups[editingGroup];
      updatedGroups[newName] = groups[editingGroup];
      setGroups(updatedGroups);
      await saveGroupColors(updatedGroups);
      setEditingGroup(null);
      setNewName('');
      // Aktualisiere Standardgruppe, falls nötig
      if (editingGroup === defaultGroup) {
        setDefaultGroup(newName);
        localStorage.setItem('defaultGroup', newName);
      }
    }
  };

  const handleDelete = async (group: string) => {
    if (Object.keys(groups).length > 1) {
      const updatedGroups = { ...groups };
      delete updatedGroups[group];
      setGroups(updatedGroups);
      await saveGroupColors(updatedGroups);
      // Wenn die gelöschte Gruppe die Standardgruppe war, setze eine neue Standardgruppe
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
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-[#460b6c] mb-4">Gruppenfarben verwalten</h3>

      <div className="space-y-4">
        {Object.entries(groups).map(([group, color]) => (
          group !== 'default' && (
            <div key={`group-${group}`} className="flex items-center gap-2 p-2 bg-white rounded shadow">
              <div className="flex-1">
                {editingGroup === group ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                ) : (
                  <span className="font-medium">{group}</span>
                )}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(group, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <button
                onClick={() => handleSetDefault(group)}
                className={`px-4 py-2 rounded ${
                  defaultGroup === group
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {defaultGroup === group ? 'Standard' : 'Als Standard'}
              </button>
              {editingGroup === group ? (
                <button
                  onClick={handleRename}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Speichern
                </button>
              ) : (
                <button
                  onClick={() => handleRenameStart(group)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Umbenennen
                </button>
              )}
              {Object.keys(groups).length > 1 && (
                <button
                  onClick={() => handleDelete(group)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Löschen
                </button>
              )}
            </div>
          )
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <h4 className="text-lg font-medium text-[#460b6c] mb-2">Neue Gruppe hinzufügen</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Neue Gruppe"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleAddGroup}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
} 