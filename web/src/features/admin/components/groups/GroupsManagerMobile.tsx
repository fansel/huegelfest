import React, { useEffect, useState } from 'react';
import { getGroupsArrayAction, createGroupAction, deleteGroupAction, updateGroupAction } from '../../../groups/actions/getGroupColors';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';

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
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

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
    setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    if (!deleteDialogId) return;
    await deleteGroupAction(deleteDialogId);
    toast.success('Gruppe gelöscht');
    setDeleteDialogId(null);
    fetchGroups();
  };

  const handleEdit = (group: Group) => {
    setEditId(group.id);
    setEditName(group.name);
    setEditColor(group.color);
    setShowAdd(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    await updateGroupAction(editId, { name: editName, color: editColor });
    toast.success('Name/Farbe geändert');
    setEditId(null);
    setEditName('');
    setEditColor('');
    setShowAdd(false);
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
                  <Input
                    type="color"
                    value={group.color}
                    onChange={e => updateGroupAction(group.id, { color: e.target.value }).then(fetchGroups)}
                    className="w-8 h-8 p-0 border-none bg-transparent opacity-0 absolute left-0 top-0 cursor-pointer"
                    style={{ minWidth: 32, minHeight: 32 }}
                  />
                </span>
                {editId === group.id ? (
                  <Input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="border-b-2 border-[#ff9900] focus:outline-none px-1 py-0.5 text-base rounded bg-gray-50 min-w-[80px]"
                  />
                ) : (
                  <span className="text-base font-medium text-gray-800">{group.name}</span>
                )}
              </div>
              <div className="flex gap-1 items-center">
                {editId === group.id ? (
                  <>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleUpdate}
                      aria-label="Speichern"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setEditId(null)}
                      aria-label="Abbrechen"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEdit(group)}
                      aria-label="Umbenennen"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(group.id)}
                      aria-label="Löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Floating Action Button */}
      <div className="mt-6 flex justify-center mb-6">
        <Button
          variant="default"
          size="icon"
          onClick={() => { setShowAdd(true); setEditId(null); setNewName(''); setNewColor(randomColor()); }}
          aria-label="Neue Gruppe erstellen"
          className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      {/* Add/Edit Sheet */}
      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh]">
          <SheetHeader>
            <SheetTitle>{editId ? 'Gruppe bearbeiten' : 'Neue Gruppe anlegen'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 items-center justify-center py-8">
            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4">
              <label htmlFor="group-name" className="text-sm font-medium text-gray-700">Name</label>
              <Input
                id="group-name"
                placeholder="Gruppenname"
                value={editId ? editName : newName}
                onChange={e => editId ? setEditName(e.target.value) : setNewName(e.target.value)}
                required
                className="w-full"
                autoFocus
              />
              <label htmlFor="group-color" className="text-sm font-medium text-gray-700">Farbe</label>
              <Input
                id="group-color"
                type="color"
                value={editId ? editColor : newColor}
                onChange={e => editId ? setEditColor(e.target.value) : setNewColor(e.target.value)}
                className="w-16 h-16 p-0 border-none bg-transparent"
              />
            </div>
            <div className="flex justify-end gap-2 px-6 pb-6 pt-2 w-full">
              <Button variant="secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>Abbrechen</Button>
              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={editId ? handleUpdate : handleAdd}>{editId ? 'Speichern' : 'Anlegen'}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Gruppe wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary" onClick={() => setDeleteDialogId(null)}>Abbrechen</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>Löschen</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsManagerMobile; 