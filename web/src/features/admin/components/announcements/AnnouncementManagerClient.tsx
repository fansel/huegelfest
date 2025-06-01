"use client";

import React, { useState, useEffect } from 'react';
import { IAnnouncement } from '@/shared/types/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import { formatDateBerlin } from '@/shared/utils/formatDateBerlin';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { saveAnnouncementsAction } from '@/features/announcements/actions/saveAnnouncementAction';
import { deleteAnnouncementAction } from '@/features/announcements/actions/deleteAnnouncement';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const MAX_LENGTH = 300;
const MAX_LINES = 14;

// Helper: Generate optimistic ID
function generateOptimisticId() {
  return 'optimistic-' + Math.random().toString(36).substr(2, 9);
}

interface WorkingGroup {
  id: string;
  name: string;
  color: string;
}

interface Announcement extends IAnnouncement {
  groupName: string;
  groupColor: string;
}

interface AnnouncementManagerClientProps {
  initialAnnouncements?: Announcement[];
  initialWorkingGroups?: WorkingGroup[];
}

function isNotDefaultGroup(group: WorkingGroup) {
  return group.name !== 'default';
}

export const AnnouncementManagerClient: React.FC<AnnouncementManagerClientProps> = ({ 
  initialAnnouncements, 
  initialWorkingGroups 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements || []);
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>(initialWorkingGroups || []);
  const [loading, setLoading] = useState(!initialAnnouncements); // No loading if initial data provided
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<IAnnouncement> | undefined>(undefined);
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const { isOnline } = useNetworkStatus();

  // WebSocket für Echtzeit-Updates von anderen Admins
  useGlobalWebSocket({
    topicFilter: [
      'announcement',
      'announcement-reaction',
      'announcements-updated'
    ],
    onMessage: async (message: any) => {
      console.log('[AnnouncementManagerClient] WebSocket message:', message);
      
      // Nur Updates von anderen Admins verarbeiten, nicht eigene optimistische Updates
      if (message.topic === 'announcement' || message.topic === 'announcements-updated') {
        // Kleine Verzögerung damit eigene Operationen erst abgeschlossen werden
        setTimeout(() => {
          refreshData();
        }, 500);
      }
    }
  });

  // Refresh data function
  const refreshData = async () => {
    if (initialAnnouncements) return; // Skip if initial data provided
    
    try {
      const data = await getAllAnnouncementsAction();
      const mapped = data.map((a: any) => ({
        ...a,
        groupName: a.groupInfo?.name || '',
        groupColor: a.groupInfo?.color || '',
      })) as Announcement[];
      setAnnouncements(mapped);
    } catch (error) {
      console.error('Error refreshing announcements:', error);
    }
  };

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

  // Load initial data if not provided
  useEffect(() => {
    if (!initialAnnouncements) {
      refreshData();
      setLoading(false);
    }
  }, []);

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

    const selectedGroup = workingGroups.find(g => g.id === groupId);
    if (!selectedGroup) {
      toast.error('Gruppe nicht gefunden.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editing && editing.id) {
        // Update existing announcement - OPTIMISTIC UPDATE
        const updatedAnnouncement: Announcement = {
          ...editing as Announcement,
          content: content.trim(),
          groupId,
          groupName: selectedGroup.name,
          groupColor: selectedGroup.color,
          updatedAt: new Date().toISOString(),
        };

        // Optimistisch in UI aktualisieren
        setAnnouncements(prev => 
          prev.map(a => a.id === editing.id ? updatedAnnouncement : a)
        );

        // API-Call
        const apiData: IAnnouncement = {
          ...updatedAnnouncement,
          reactions: updatedAnnouncement.reactions || {}
        };
        await saveAnnouncementsAction([apiData]);
        toast.success('Ankündigung wurde aktualisiert');

      } else {
        // Create new announcement - OPTIMISTIC UPDATE
        const optimisticId = generateOptimisticId();
        const now = new Date().toISOString();
        
        const newAnnouncement: Announcement = {
          id: optimisticId,
          content: content.trim(),
          groupId,
          groupName: selectedGroup.name,
          groupColor: selectedGroup.color,
          important: false,
          reactions: {},
          date: '',
          time: '',
          createdAt: now,
          updatedAt: now,
        };

        // Optimistisch zu UI hinzufügen (am Anfang der Liste)
        setAnnouncements(prev => [newAnnouncement, ...prev]);

        // API-Call
        const apiData: IAnnouncement = {
          id: '', // Backend generates real ID
          content: content.trim(),
          groupId,
          groupName: selectedGroup.name,
          groupColor: selectedGroup.color,
          important: false,
          reactions: {},
          date: '',
          time: '',
          createdAt: now,
          updatedAt: now,
        };

        try {
          await saveAnnouncementsAction([apiData]);
          toast.success('Ankündigung wurde erstellt');
          
          // Ersetze optimistisches Item durch echte Daten nach kurzer Verzögerung
          setTimeout(async () => {
            try {
              const data = await getAllAnnouncementsAction();
              const mapped = data.map((a: any) => ({
                ...a,
                groupName: a.groupInfo?.name || '',
                groupColor: a.groupInfo?.color || '',
              })) as Announcement[];
              
              // Behalte nur nicht-optimistische Items und füge neue echte Daten hinzu
              setAnnouncements(prev => {
                const nonOptimistic = prev.filter(a => !a.id.startsWith('optimistic-'));
                return mapped;
              });
            } catch (error) {
              console.error('Error updating with real data:', error);
            }
          }, 1000);
          
        } catch (error) {
          // Bei Fehler: optimistische Announcement entfernen
          setAnnouncements(prev => prev.filter(a => a.id !== optimisticId));
          throw error;
        }
      }
      
      setFormOpen(false);
      setEditing(undefined);
      setContent('');
      setGroupId('');
      
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
    
    // Optimistisch aus UI entfernen
    const prevAnnouncements = announcements;
    setAnnouncements(prev => prev.filter(a => a.id !== deleteDialogId));
    
    try {
      await deleteAnnouncementAction(deleteDialogId);
      toast.success('Ankündigung gelöscht');
    } catch (error) {
      // Bei Fehler: wieder hinzufügen
      setAnnouncements(prevAnnouncements);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Ankündigungen...</div>
      </div>
    );
  }

  return (
    !isMobile ? (
      <div className="relative min-h-[60vh] pb-24 flex flex-col max-w-5xl mx-auto">
        {/* Gemeinsame Header-Row */}
        <div className="flex flex-row items-center gap-8 mt-8 mb-6">
          <h2 className="text-xl font-bold text-[#460b6c] flex-1">{editing?.id ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}</h2>
          <h2 className="text-xl font-bold text-[#460b6c] flex-1 text-center">Ankündigungen</h2>
        </div>
        <div className="flex flex-row gap-4 justify-center">
          {/* Linke Spalte: Immer sichtbares Formular, jetzt mit stärkerem Shadow/Border */}
          <div className="w-full max-w-lg flex-shrink-0">
            <div className="bg-white/90 rounded-2xl shadow-2xl border-2 border-gray-300 p-6 sticky top-8">
              <div className="flex flex-col gap-4">
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
                    <SelectValue>{workingGroups.find(g => g.id === groupId)?.name || 'Wähle eine Gruppe'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {workingGroups.filter(isNotDefaultGroup).map(group => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2 pt-2">
                  {editing?.id && (
                    <Button variant="secondary" onClick={() => { setEditing(undefined); setContent(''); setGroupId(''); }}>Abbrechen</Button>
                  )}
                  <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSave} disabled={isSubmitting || content.length > MAX_LENGTH || content.split('\n').length > MAX_LINES}>
                    {isSubmitting ? 'Wird gespeichert...' : editing?.id ? 'Aktualisieren' : 'Speichern'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          {/* Rechte Spalte: Liste, mittig */}
          <div className="flex-1 min-w-0 flex justify-center">
            <div className="space-y-5 px-2 sm:px-0 mt-0 max-w-2xl w-full mx-auto">
              {announcements.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-lg font-medium">Keine Ankündigungen vorhanden</p>
              ) : (
                [...announcements]
                  .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
                  .map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      content={announcement.content}
                      groupName={announcement.groupName ?? 'Gruppe'}
                      groupColor={announcement.groupColor}
                      important={announcement.important}
                      createdAt={announcement.createdAt ? formatDateBerlin(announcement.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      onEdit={() => handleEdit(announcement)}
                      onDelete={() => handleDelete(announcement.id)}
                      isLoadingDelete={deleteDialogId === announcement.id}
                      className="bg-white/80 transition-all duration-200 hover:scale-[1.01]"
                      isOffline={!isOnline}
                    />
                  ))
              )}
            </div>
          </div>
          {/* Delete Dialog bleibt global */}
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
      </div>
    ) : (
      <div className="relative min-h-[60vh] pb-24">
        <h2 className="text-xl font-bold mb-4 text-[#460b6c] text-center tracking-tight">Ankündigungen</h2>
        <div className="space-y-5 px-2 sm:px-0 mt-0 max-w-2xl w-full mx-auto">
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-lg font-medium">Keine Ankündigungen vorhanden</p>
          ) : (
            [...announcements]
              .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
              .map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  content={announcement.content}
                  groupName={announcement.groupName ?? 'Gruppe'}
                  groupColor={announcement.groupColor}
                  important={announcement.important}
                  createdAt={announcement.createdAt ? formatDateBerlin(announcement.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  onEdit={() => handleEdit(announcement)}
                  onDelete={() => handleDelete(announcement.id)}
                  isLoadingDelete={deleteDialogId === announcement.id}
                  className="bg-white/80 transition-all duration-200 hover:scale-[1.01]"
                  isOffline={!isOnline}
                />
              ))
          )}
        </div>
        {/* Floating Action Button */}
        <div className="mt-6 flex justify-center mb-6">
          <Button
            variant="default"
            size="icon"
            onClick={() => { setFormOpen(true); setEditing(undefined); setContent(''); setGroupId(''); }}
            aria-label="Neue Ankündigung erstellen"
            className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {/* Add/Edit Sheet */}
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh]">
            <SheetHeader>
              <SheetTitle>{editing?.id ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 items-center justify-center py-8">
              <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4">
                <label htmlFor="mobile-announcement-content" className="text-sm font-medium text-gray-700">Inhalt</label>
                <Textarea
                  id="mobile-announcement-content"
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
                  autoFocus
                />
                <div className={`text-right text-xs mt-1 ${content.length >= MAX_LENGTH || content.split('\n').length >= MAX_LINES ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{content.length}/{MAX_LENGTH} Zeichen, {content.split('\n').length}/{MAX_LINES} Zeilen</div>
                <label htmlFor="mobile-announcement-group" className="text-sm font-medium text-gray-700">Gruppe</label>
                <Select value={groupId} onValueChange={setGroupId} required>
                  <SelectTrigger className="w-full" id="mobile-announcement-group">
                    <SelectValue>{workingGroups.find(g => g.id === groupId)?.name || 'Wähle eine Gruppe'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {workingGroups.filter(isNotDefaultGroup).map(group => (
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
    )
  );
}; 