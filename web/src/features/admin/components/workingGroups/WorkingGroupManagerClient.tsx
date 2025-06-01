import React, { useEffect, useState } from 'react';
import { getWorkingGroupsArrayAction, createWorkingGroupAction, deleteWorkingGroupAction, updateWorkingGroupAction } from '../../../workingGroups/actions/getWorkingGroupColors';
import { toast } from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, Dices } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';

interface WorkingGroup {
  id: string;
  name: string;
  color: string;
}

interface WorkingGroupManagerProps {
  initialWorkingGroups: WorkingGroup[];
}

// Erzeugt eine zufällige, harmonische Farbe als Hex-String
function randomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 60;
  const l = 60;
  // Nutzt CSS-Feature: hsl() → Hex-Konvertierung über Canvas
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#cccccc';
  ctx.fillStyle = `hsl(${h},${s}%,${l}%)`;
  return ctx.fillStyle as string; // gibt Hex zurück
}

// Hilfsfunktion: Filtert die Default-Gruppe aus der Anzeige
function isNotDefaultWorkingGroup(group: WorkingGroup): boolean {
  return group.name.toLowerCase() !== 'default';
}

const WorkingGroupManagerClient: React.FC<WorkingGroupManagerProps> = ({ initialWorkingGroups }) => {
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>(initialWorkingGroups);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(randomColor());
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const formRef = React.useRef<HTMLDivElement>(null);

  const fetchWorkingGroups = async () => {
    setLoading(true);
    const data = await getWorkingGroupsArrayAction();
    setWorkingGroups(data);
    setLoading(false);
  };

  useEffect(() => { fetchWorkingGroups(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Bitte gib einen Gruppennamen ein!');
      return;
    }
    if (workingGroups.some(g => g.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error('Es existiert bereits eine Gruppe mit diesem Namen!');
      return;
    }
    setIsSubmitting(true);
    try {
      await createWorkingGroupAction(newName.trim(), newColor);
      toast.success('Gruppe erstellt');
      setNewName('');
      setNewColor(randomColor());
      setShowAdd(false);
      fetchWorkingGroups();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    if (!deleteDialogId) return;
    await deleteWorkingGroupAction(deleteDialogId);
    toast.success('Gruppe gelöscht');
    setDeleteDialogId(null);
    fetchWorkingGroups();
  };

  const handleEdit = (group: WorkingGroup) => {
    setEditId(group.id);
    setEditName(group.name);
    setEditColor(group.color);
    setShowAdd(true);
    // Desktop: Formular scrollen und fokussieren
    if (!isMobile && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: Fokus auf das Namensfeld setzen
      const input = formRef.current.querySelector<HTMLInputElement>('#group-name');
      input?.focus();
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    if (workingGroups.some(g => g.name.toLowerCase() === editName.trim().toLowerCase() && g.id !== editId)) {
      toast.error('Es existiert bereits eine Gruppe mit diesem Namen!');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateWorkingGroupAction(editId, { name: editName, color: editColor });
      toast.success('Name/Farbe geändert');
      setEditId(null);
      setEditName('');
      setEditColor('');
      setShowAdd(false);
      fetchWorkingGroups();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    !isMobile ? (
      <div className="relative min-h-[60vh] pb-24 flex flex-col max-w-4xl mx-auto">
        {/* Gemeinsame Header-Row */}
        <div className="flex flex-row items-center gap-8 mt-8 mb-6">
          <h2 className="text-xl font-bold text-[#460b6c] flex-1">{editId ? 'Gruppe bearbeiten' : 'Neue Gruppe anlegen'}</h2>
          <h2 className="text-xl font-bold text-[#460b6c] flex-1 text-center">Gruppen</h2>
        </div>
        <div className="flex flex-row gap-4 justify-center">
          {/* Linke Spalte: Immer sichtbares Formular, jetzt breiter und mit stärkerem Shadow/Border */}
          <div className="w-full max-w-lg flex-shrink-0" ref={formRef}>
            <div className="bg-white/90 rounded-2xl shadow-2xl border-2 border-gray-300 p-6 sticky top-8">
              <div className="flex flex-col gap-4">
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
                <div className="flex items-center gap-2">
                  <Input
                    id="group-color"
                    type="color"
                    value={editId ? editColor : newColor}
                    onChange={e => editId ? setEditColor(e.target.value) : setNewColor(e.target.value)}
                    className="w-16 h-16 p-0 border-none bg-transparent"
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    aria-label="Neue Farbe würfeln"
                    className="rounded-full p-2 bg-[#ff9900] hover:bg-orange-600 text-white shadow transition flex items-center justify-center"
                    onClick={() => editId ? setEditColor(randomColor()) : setNewColor(randomColor())}
                    tabIndex={0}
                  >
                    <Dices className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editId && (
                    <Button variant="secondary" onClick={() => { setEditId(null); setEditName(''); setEditColor(''); }}>Abbrechen</Button>
                  )}
                  <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={editId ? handleUpdate : handleAdd} disabled={isSubmitting}>
                    {isSubmitting ? 'Wird gespeichert...' : editId ? 'Speichern' : 'Anlegen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Rechte Spalte: Liste, mittig */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="space-y-4 px-2 sm:px-0 max-w-2xl w-full mx-auto">
              {loading ? <div className="text-center text-gray-400 py-8">Lade Gruppen...</div> : (
                <ul className="space-y-4 px-2 sm:px-0">
                  {workingGroups.filter(isNotDefaultWorkingGroup).map(group => (
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
                            onChange={e => updateWorkingGroupAction(group.id, { color: e.target.value }).then(fetchWorkingGroups)}
                            className="w-8 h-8 p-0 border-none bg-transparent opacity-0 absolute left-0 top-0 cursor-pointer"
                            style={{ minWidth: 32, minHeight: 32 }}
                          />
                        </span>
                        <span className="text-base font-medium text-gray-800">{group.name}</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleEdit(group)}
                          aria-label="Bearbeiten"
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
      </div>
    ) : (
      <div className="relative min-h-[60vh] pb-24">
        <h2 className="text-xl font-bold mb-4 text-[#460b6c] text-center tracking-tight">Gruppen</h2>
        {loading ? <div className="text-center text-gray-400 py-8">Lade Gruppen...</div> : (
          <ul className="space-y-4 px-2 sm:px-0">
            {workingGroups.filter(isNotDefaultWorkingGroup).map(group => (
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
                      onChange={e => updateWorkingGroupAction(group.id, { color: e.target.value }).then(fetchWorkingGroups)}
                      className="w-8 h-8 p-0 border-none bg-transparent opacity-0 absolute left-0 top-0 cursor-pointer"
                      style={{ minWidth: 32, minHeight: 32 }}
                    />
                  </span>
                  <span className="text-base font-medium text-gray-800">{group.name}</span>
                </div>
                <div className="flex gap-1 items-center">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleEdit(group)}
                    aria-label="Bearbeiten"
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
                <div className="flex items-center gap-2">
                  <Input
                    id="group-color"
                    type="color"
                    value={editId ? editColor : newColor}
                    onChange={e => editId ? setEditColor(e.target.value) : setNewColor(e.target.value)}
                    className="w-16 h-16 p-0 border-none bg-transparent"
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    aria-label="Neue Farbe würfeln"
                    className="rounded-full p-2 bg-[#ff9900] hover:bg-orange-600 text-white shadow transition flex items-center justify-center"
                    onClick={() => editId ? setEditColor(randomColor()) : setNewColor(randomColor())}
                    tabIndex={0}
                  >
                    <Dices className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 pb-6 pt-2 w-full">
                <Button variant="secondary" onClick={() => { setShowAdd(false); setEditId(null); }}>Abbrechen</Button>
                <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={editId ? handleUpdate : handleAdd} disabled={isSubmitting}>
                  {isSubmitting ? 'Wird gespeichert...' : editId ? 'Speichern' : 'Anlegen'}
                </Button>
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
    )
  );
};

export default WorkingGroupManagerClient; 