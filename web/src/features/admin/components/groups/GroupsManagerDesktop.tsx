import React, { useEffect, useState } from 'react';
import { getGroupsArrayAction, createGroupAction, deleteGroupAction, updateGroupAction } from '../../../groups/actions/getGroupColors';

interface Group {
  id: string;
  name: string;
  color: string;
}

function randomColor(): string {
  const colors = [
    '#ff9900', '#460b6c', '#00b894', '#0984e3', '#fd79a8', '#e17055', '#fdcb6e', '#636e72', '#00cec9', '#6c5ce7',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const GroupsManagerDesktop: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(randomColor());
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    const data = await getGroupsArrayAction();
    setGroups(data);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createGroupAction(newName.trim(), newColor);
    setNewName('');
    setNewColor(randomColor());
    fetchGroups();
  };

  const handleDelete = async (id: string) => {
    await deleteGroupAction(id);
    fetchGroups();
  };

  const handleEdit = (group: Group) => {
    setEditId(group.id);
    setEditName(group.name);
    setEditColor(group.color);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    await updateGroupAction(editId, { name: editName, color: editColor });
    setEditId(null);
    setEditName('');
    setEditColor('');
    fetchGroups();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-[#460b6c]">Gruppen verwalten</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Gruppenname"
          className="border rounded p-2 flex-1"
        />
        <input
          type="color"
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
          className="w-12 h-12 p-0 border-none bg-transparent"
        />
        <button onClick={handleAdd} className="bg-[#ff9900] text-white px-4 py-2 rounded hover:bg-orange-600">Hinzufügen</button>
      </div>
      {loading ? <div>Lade Gruppen...</div> : (
        <table className="w-full text-left border-t">
          <thead>
            <tr className="text-[#460b6c]">
              <th className="py-2">Name</th>
              <th className="py-2">Farbe</th>
              <th className="py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id} className="border-t">
                <td className="py-2">
                  {editId === group.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border rounded p-1"
                    />
                  ) : (
                    group.name
                  )}
                </td>
                <td className="py-2">
                  {editId === group.id ? (
                    <input
                      type="color"
                      value={editColor}
                      onChange={e => setEditColor(e.target.value)}
                      className="w-8 h-8 p-0 border-none bg-transparent"
                    />
                  ) : (
                    <span className="inline-block w-8 h-8 rounded-full border" style={{ background: group.color }} />
                  )}
                </td>
                <td className="py-2 space-x-2">
                  {editId === group.id ? (
                    <>
                      <button onClick={handleUpdate} className="bg-[#00b894] text-white px-2 py-1 rounded">Speichern</button>
                      <button onClick={() => setEditId(null)} className="bg-gray-300 px-2 py-1 rounded">Abbrechen</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(group)} className="bg-blue-500 text-white px-2 py-1 rounded">Bearbeiten</button>
                      <button onClick={() => handleDelete(group.id)} className="bg-red-500 text-white px-2 py-1 rounded">Löschen</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GroupsManagerDesktop; 