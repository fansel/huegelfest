import React, { useState, useEffect } from 'react';
import { useAnnouncementsManager } from '../../hooks/useAnnouncementsManager';
import { IAnnouncement } from '@/shared/types/types';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';

const AnnouncementsDesktop: React.FC = () => {
  const manager = useAnnouncementsManager();
  const [editing, setEditing] = useState<IAnnouncement | undefined>(undefined);
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const MAX_LENGTH = 300;
  const MAX_LINES = 14;

  useEffect(() => {
    if (editing) {
      setContent(editing.content);
      setGroupId(editing.groupId);
      setShowDialog(true);
    } else {
      setContent('');
      setGroupId('');
    }
  }, [editing]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Bitte gib einen Inhalt ein.');
      return;
    }
    if (!groupId) {
      toast.error('Bitte wähle eine Gruppe aus.');
      return;
    }
    setIsSubmitting(true);
    try {
      const announcementData: IAnnouncement = {
        id: editing?.id || '',
        content: content.trim(),
        groupId,
        groupName: '',
        groupColor: '',
        important: editing?.important || false,
        reactions: {},
        date: editing?.date || '',
        time: editing?.time || '',
        createdAt: editing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (editing) {
        await manager.updateAnnouncement(announcementData.id, announcementData);
        toast.success('Ankündigung wurde aktualisiert');
      } else {
        await manager.createAnnouncement(announcementData);
        toast.success('Ankündigung wurde erstellt');
      }
      setEditing(undefined);
      setShowDialog(false);
      setContent('');
      setGroupId('');
    } catch (error) {
      toast.error('Die Ankündigung konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await manager.deleteAnnouncement(id);
      toast.success('Ankündigung gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeletingId(null);
      setDeleteDialogId(null);
    }
  };

  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Dialog-Modal für Formular */}
      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) setEditing(undefined); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <label htmlFor="announcement-content" className="text-sm font-medium text-gray-700">Inhalt</label>
            <Textarea
              id="announcement-content"
              value={content}
              onChange={e => {
                let value = e.target.value.slice(0, MAX_LENGTH);
                const lines = value.split('\n');
                if (lines.length > MAX_LINES) {
                  value = lines.slice(0, MAX_LINES).join('\n');
                }
                setContent(value);
              }}
              placeholder="Gebe hier deine Ankündigung ein..."
              rows={3}
              className="w-full"
              required
              maxLength={MAX_LENGTH}
            />
            <div className={`text-right text-xs mt-1 ${content.length >= MAX_LENGTH || content.split('\n').length >= MAX_LINES ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{content.length}/{MAX_LENGTH} Zeichen, {content.split('\n').length}/{MAX_LINES} Zeilen</div>
            <label htmlFor="announcement-group" className="text-sm font-medium text-gray-700">Gruppe</label>
            <Select value={groupId} onValueChange={setGroupId} required>
              <SelectTrigger className="w-full" id="announcement-group">
                <SelectValue>{manager.groups.find(g => g.id === groupId)?.name || 'Wähle eine Gruppe'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {manager.groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter className="w-full flex-row justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button variant="secondary" onClick={() => { setShowDialog(false); setEditing(undefined); }}>Abbrechen</Button>
              </DialogClose>
              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSave} disabled={isSubmitting || content.length > MAX_LENGTH || content.split('\n').length > MAX_LINES}>
                {isSubmitting ? 'Wird gespeichert...' : editing ? 'Aktualisieren' : 'Speichern'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Plus-Button */}
      <div className="flex flex-col">
        <Button variant="default" size="icon" className="mb-4 self-end" onClick={() => { setEditing(undefined); setShowDialog(true); }} aria-label="Neue Ankündigung anlegen"><Plus /></Button>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-[#460b6c] mb-4">Aktuelle Ankündigungen</h3>
          <div className="space-y-4">
            {manager.announcements.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-lg font-medium">Keine Ankündigungen vorhanden</p>
            ) : (
              [...manager.announcements]
                .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
                .map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    content={announcement.content}
                    groupName={announcement.groupName ?? 'Gruppe'}
                    groupColor={announcement.groupColor}
                    important={announcement.important}
                    createdAt={announcement.createdAt}
                    onEdit={() => { setEditing(announcement); setShowDialog(true); }}
                    onDelete={() => setDeleteDialogId(announcement.id)}
                    isLoadingDelete={deletingId === announcement.id}
                  />
                ))
            )}
          </div>
        </div>
      </div>
      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={open => { if (!open) setDeleteDialogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Ankündigung wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="secondary" onClick={() => setDeleteDialogId(null)}>Abbrechen</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={() => handleDelete(deleteDialogId!)}>Löschen</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementsDesktop; 