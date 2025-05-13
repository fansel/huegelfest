import React, { useEffect, useState } from 'react';
import { getGroupsArrayAction, createGroupAction, deleteGroupAction, updateGroupAction } from '../../../groups/actions/getGroupColors';
import { toast } from 'react-hot-toast';
import { Trash2, Pencil, Plus, Check, X } from 'lucide-react';

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

const GroupsManagerMobile: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
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
    if (!newName.trim()) {
      toast.error('Bitte gib einen Gruppennamen ein!');
      return;
    }
    await createGroupAction(newName.trim(), newColor);
    toast.success('Gruppe erstellt');
    setNewName('');
    setNewColor(randomColor());
    setShowAdd(false);
    fetchGroups();
  };

  const handleDelete = async (id: string) => {
    await deleteGroupAction(id);
    toast.success('Gruppe gelöscht');
    fetchGroups();
  };

  const handleColorChange = async (group: Group, color: string) => {
    await updateGroupAction(group.id, { color });
    toast.success('Farbe geändert');
    fetchGroups();
  };

  const handleEdit = (group: Group) => {
    setEditId(group.id);
    setEditName(group.name);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    await updateGroupAction(editId, { name: editName });
    toast.success('Name geändert');
    setEditId(null);
    setEditName('');
    fetchGroups();
  };

  return (
    <div className="relative min-h-[60vh] pb-24">
      <h2 className="text-xl font-bold mb-4 text-[#460b6c] text-center tracking-tight">Gruppen</h2>
      {loading ? <div className="text-center text-gray-400 py-8">Lade Gruppen...</div> : (
        <ul className="space-y-4 px-2 sm:px-0">
          {groups.map(group => (
            <li
              key={group.id}
              className="bg-white/90 shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between transition-all duration-200 hover:scale-[1.01]"
              style={{ boxShadow: `0 2px 12px 0 ${group.color}33` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block w-8 h-8 rounded-full border-2 border-white shadow cursor-pointer relative"
                  style={{ background: group.color }}
                  title="Farbe ändern"
                >
                  <input
                    type="color"
                    value={group.color}
                    onChange={e => handleColorChange(group, e.target.value)}
                    className="w-8 h-8 p-0 border-none bg-transparent opacity-0 absolute left-0 top-0 cursor-pointer"
                    style={{ minWidth: 32, minHeight: 32 }}
                  />
                </span>
                {editId === group.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="border-b-2 border-[#ff9900] focus:outline-none px-1 py-0.5 text-base rounded bg-gray-50"
                    style={{ minWidth: 80 }}
                  />
                ) : (
                  <span className="text-base font-medium text-gray-800">{group.name}</span>
                )}
              </div>
              <div className="flex gap-1 items-center">
                {editId === group.id ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                      aria-label="Speichern"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="rounded-full bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 focus:outline-none border border-gray-300"
                      aria-label="Abbrechen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(group)}
                      className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                      aria-label="Umbenennen"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                      aria-label="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Add Sheet Trigger: Plus-Button mittig über der Liste */}
      <div className="mt-6 flex justify-center mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
          aria-label="Neue Gruppe erstellen"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {/* Abstand zwischen Plus-Button und Liste */}
      <div className="mt-4" />
      {/* Add Sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/10 flex items-end justify-center">
          <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[60vh]">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
              <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-transparent">
              <span className="text-xl font-bold text-[#460b6c] tracking-tight">
                Neue Gruppe anlegen
              </span>
              <button
                onClick={() => setShowAdd(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 items-center justify-center">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Gruppenname"
                className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
              />
              <input
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-16 h-16 p-0 border-none bg-transparent"
              />
              <button
                onClick={handleAdd}
                className="bg-[#ff9900] text-white px-6 py-2 rounded-full text-lg font-bold shadow hover:bg-orange-600 active:scale-95 transition"
              >
                Gruppe anlegen
              </button>
            </div>
          </div>
          <style jsx global>{`
            @keyframes modern-sheet {
              0% { transform: translateY(100%) scale(0.98); opacity: 0.7; }
              80% { transform: translateY(-8px) scale(1.02); opacity: 1; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            .animate-modern-sheet {
              animation: modern-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default GroupsManagerMobile; 