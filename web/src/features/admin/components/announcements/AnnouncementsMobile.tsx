import React, { useState, useEffect } from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { Plus } from 'lucide-react';
import { useAnnouncementsManager } from '../../hooks/useAnnouncementsManager';
import { toast } from 'react-hot-toast';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const MAX_LENGTH = 300;
const MAX_LINES = 14;

const AnnouncementsMobile: React.FC = () => {
  const manager = useAnnouncementsManager();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<IAnnouncement> | undefined>(undefined);
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setContent(editing.content ?? '');
      setGroupId(editing.groupId ?? '');
      setFormOpen(true);
    } else {
      setContent('');
      setGroupId('');
    }
  }, [editing]);

  const handleEdit = (announcement?: IAnnouncement) => {
    setEditing(announcement);
    setFormOpen(true);
  };

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
      const announcementData: Partial<IAnnouncement> = {
        ...editing,
        content: content.trim(),
        groupId,
      };
      if (editing && editing.id) {
        await manager.updateAnnouncement(editing.id, announcementData);
        toast.success('Ankündigung wurde aktualisiert');
      } else {
        await manager.createAnnouncement({
          content: content.trim(),
          groupId,
          groupName: '',
          groupColor: '',
          important: editing?.important || false,
          reactions: {},
          date: editing?.date || '',
          time: editing?.time || '',
        });
        toast.success('Ankündigung wurde erstellt');
      }
      setFormOpen(false);
      setEditing(undefined);
    } catch (error) {
      toast.error('Die Ankündigung konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteDialogId(id);
  };

  const confirmDelete = async () => {
    if (!deleteDialogId) return;
    try {
      await manager.deleteAnnouncement(deleteDialogId);
      toast.success('Ankündigung gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogId(null);
    }
  };

  return (
    <div className="relative min-h-[60vh] pb-24">
      {/* Plus-Button mittig über der Liste */}
      <div className="mt-6 flex justify-center mb-6">
        <Button
          variant="default"
          size="icon"
          onClick={() => handleEdit(undefined)}
          aria-label="Neue Ankündigung erstellen"
          className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      {/* Liste */}
      <div className="space-y-5 px-2 sm:px-0">
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
                onEdit={() => handleEdit(announcement)}
                onDelete={() => handleDelete(announcement.id)}
                isLoadingDelete={deleteDialogId === announcement.id}
              />
            ))
        )}
      </div>
      {/* Sheet für Formular */}
      <Sheet open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) setEditing(undefined); }}>
        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[85vh]">
          <SheetHeader>
            <SheetTitle>{editing?.id ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 items-center justify-center py-8">
            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4">
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
            </div>
            <div className="flex justify-end gap-2 px-6 pb-6 pt-2 w-full">
              <Button variant="secondary" onClick={() => { setFormOpen(false); setEditing(undefined); }}>Abbrechen</Button>
              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSave} disabled={isSubmitting || content.length > MAX_LENGTH || content.split('\n').length > MAX_LINES}>
                {isSubmitting ? 'Wird gespeichert...' : editing?.id ? 'Aktualisieren' : 'Speichern'}
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
              Diese Ankündigung wirklich löschen?
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

export default AnnouncementsMobile; 