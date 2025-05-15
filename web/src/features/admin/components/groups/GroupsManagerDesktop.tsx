import React, { useEffect, useState } from 'react';
import { getGroupsArrayAction, createGroupAction, deleteGroupAction, updateGroupAction } from '../../../groups/actions/getGroupColors';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/shared/components/ui/dialog';

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
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(randomColor());
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    setShowAdd(false);
    fetchGroups();
  };

  const handleDelete = async (id: string) => {
    await deleteGroupAction(id);
    setConfirmDelete(null);
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
    <div className="max-w-3xl mx-auto p-4">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-[#460b6c]">Gruppen verwalten</CardTitle>
          <Button variant="default" size="icon" onClick={() => setShowAdd(true)} aria-label="Neue Gruppe anlegen"><Plus /></Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center text-gray-400 py-8">Lade Gruppen...</div> : (
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
                        <Input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{group.name}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editId === group.id ? (
                        <Input
                          type="color"
                          value={editColor}
                          onChange={e => setEditColor(e.target.value)}
                          className="w-10 h-10 p-0 border-none bg-transparent"
                        />
                      ) : (
                        <span className="inline-block w-8 h-8 rounded-full border" style={{ background: group.color }} />
                      )}
                    </td>
                    <td className="py-2 space-x-2">
                      {editId === group.id ? (
                        <>
                          <Button variant="default" size="icon" onClick={handleUpdate} aria-label="Speichern"><Check /></Button>
                          <Button variant="secondary" size="icon" onClick={() => setEditId(null)} aria-label="Abbrechen"><X /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="icon" onClick={() => handleEdit(group)} aria-label="Bearbeiten"><Pencil /></Button>
                          <Button variant="destructive" size="icon" onClick={() => setConfirmDelete(group.id)} aria-label="Löschen"><Trash2 /></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Gruppe anlegen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6 items-center justify-center py-4">
            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2">
              <label htmlFor="group-name" className="text-sm font-medium text-gray-700">Name</label>
              <Input
                id="group-name"
                placeholder="Gruppenname"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="w-full"
                autoFocus
              />
              <label htmlFor="group-color" className="text-sm font-medium text-gray-700">Farbe</label>
              <Input
                id="group-color"
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="w-16 h-16 p-0 border-none bg-transparent"
              />
            </div>
            <DialogFooter className="w-full flex-row justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary" onClick={() => setShowAdd(false)}>Abbrechen</Button>
              </DialogClose>
              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleAdd}>Anlegen</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Gruppe wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => handleDelete(confirmDelete!)}>Löschen</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GroupsManagerDesktop; 