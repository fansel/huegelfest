import React, { useEffect, useState, useRef } from 'react';
import { fetchDays } from '@/features/timeline/actions/fetchDays';
import { fetchEventsByDayAdmin } from '@/features/timeline/actions/fetchEventsByDayAdmin';
import { moderateEvent } from '@/features/timeline/actions/moderateEvent';
import { removeEvent } from '@/features/timeline/actions/removeEvent';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, Trash2, Pencil, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { createDayAction } from '@/features/timeline/actions/createDay';
import { updateDayAction } from '@/features/timeline/actions/updateDay';
import { removeDayAction } from '@/features/timeline/actions/removeDay';

function getIdString(id: any) {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && ('$oid' in id)) return id.$oid;
  return String(id);
}

const TimelineDesktop: React.FC = () => {
  const [days, setDays] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [eventsByDay, setEventsByDay] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayForm, setDayForm] = useState<{ title: string; description: string; date: Date | null }>({ title: '', description: '', date: null });
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const isSavingDayRef = useRef(false);

  // Initialdaten laden
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const daysRes = await fetchDays();
        setDays(daysRes);
        const cats = await getCategoriesAction();
        setCategories(cats);
        // Events für alle Days laden
        const eventsObj: Record<string, any[]> = {};
        for (const day of daysRes) {
          const events = await fetchEventsByDayAdmin(getIdString(day._id));
          eventsObj[getIdString(day._id)] = events;
        }
        setEventsByDay(eventsObj);
      } catch (e: any) {
        setError(e?.message || 'Fehler beim Laden der Timeline');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Approve/Reject
  const handleModerate = async (eventId: string, status: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      await moderateEvent(eventId, status);
      toast.success(status === 'approved' ? 'Event freigegeben' : 'Event abgelehnt');
      // Events neu laden
      const eventsObj: Record<string, any[]> = { ...eventsByDay };
      for (const day of days) {
        const events = await fetchEventsByDayAdmin(getIdString(day._id));
        eventsObj[getIdString(day._id)] = events;
      }
      setEventsByDay(eventsObj);
    } catch (e: any) {
      toast.error(e?.message || 'Fehler bei Moderation');
    } finally {
      setLoading(false);
    }
  };

  // Event löschen
  const handleDeleteEvent = async (eventId: string, dayId: string) => {
    setLoading(true);
    try {
      await removeEvent(eventId);
      toast.success('Event gelöscht');
      // Events neu laden
      const events = await fetchEventsByDayAdmin(dayId);
      setEventsByDay(prev => ({ ...prev, [dayId]: events }));
    } catch (e: any) {
      toast.error(e?.message || 'Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDay = async () => {
    if (isSavingDayRef.current) return;
    if (!dayForm.title || !dayForm.date) {
      toast.error('Titel und Datum sind erforderlich');
      return;
    }
    isSavingDayRef.current = true;
    setLoading(true);
    try {
      if (editDayId) {
        const result = await updateDayAction(editDayId, {
          title: dayForm.title,
          description: dayForm.description,
          date: dayForm.date,
        });
        if (result?.success) {
          toast.success('Tag aktualisiert');
        } else {
          toast.error(result?.error || 'Fehler beim Aktualisieren des Tages');
        }
        setEditDayId(null);
      } else {
        const result = await createDayAction({
          title: dayForm.title,
          description: dayForm.description,
          date: dayForm.date,
        });
        if (result?.success) {
          toast.success('Tag angelegt');
        } else {
          toast.error(result?.error || 'Fehler beim Anlegen des Tages');
        }
      }
      setShowDayModal(false);
      setDayForm({ title: '', description: '', date: null });
      const daysRes = await fetchDays();
      setDays(daysRes);
    } catch (err) {
      toast.error('Fehler beim Speichern des Tages');
    } finally {
      setLoading(false);
      isSavingDayRef.current = false;
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    try {
      await removeDayAction(dayId);
      toast.success('Tag gelöscht');
      const daysRes = await fetchDays();
      setDays(daysRes);
    } catch (err) {
      toast.error('Fehler beim Löschen des Tages');
    }
  };

  if (loading) return <div className="p-8 text-center text-[#ff9900]">Lade Timeline..</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {days.length === 0 ? (
        <div className="text-gray-400 italic p-8 w-full text-center">Noch keine Tage vorhanden.</div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center">
          {days.map(day => {
                  const dayId = getIdString(day._id);
            const events = eventsByDay[dayId] || [];
                  return (
                    <Card key={dayId} className="min-w-[340px] max-w-[400px] flex-1 shadow-lg border border-gray-200 bg-white/95 hover:shadow-2xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                        <CardTitle className="truncate text-lg font-bold text-[#460b6c]">{day.title}</CardTitle>
                        <span className="text-xs text-gray-500 font-medium ml-auto whitespace-nowrap">{day.date ? format(new Date(day.date), 'EEE, dd.MM.yyyy', { locale: de }) : ''}</span>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                  {events.length === 0 ? (
                    <div className="text-gray-400 italic">Keine Events für diesen Tag.</div>
                  ) : (
                    events.map(event => {
                              const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                      const IconComponent = category ? (LucideIcons as any)[category.icon] : LucideIcons.HelpCircle;
                              return (
                        <Card key={event._id} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow border-0 bg-white/95 hover:shadow-lg transition-all">
                                  <span className="flex-shrink-0">{IconComponent && <IconComponent className="text-xl" style={{ color: category?.color || '#ff9900' }} />}</span>
                                  <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate text-base flex items-center gap-2">
                              {event.title}
                              {event.status === 'pending' && <Badge className="bg-yellow-400 text-white ml-2">Ausstehend</Badge>}
                              {event.status === 'approved' && <Badge className="bg-green-500 text-white ml-2">Freigegeben</Badge>}
                              {event.status === 'rejected' && <Badge className="bg-red-500 text-white ml-2">Abgelehnt</Badge>}
                            </div>
                                    <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                              <Badge style={{ background: category?.color || '#ff9900', color: '#fff' }} className="px-2 py-0.5 text-xs font-medium rounded">{category?.name || category?.label || 'Kategorie'}</Badge>
                                      <span>{event.time}</span>
                                      {event.description && <span className="text-gray-400">· {event.description}</span>}
                                    </div>
                            {event.offeredBy && <div className="text-xs text-[#460b6c] mt-1">Angeboten von: <span className="font-semibold">{event.offeredBy}</span></div>}
                                  </div>
                                  <div className="flex gap-1 items-center ml-2">
                            {event.status === 'pending' && (
                              <>
                                <Button size="icon" variant="default" className="bg-green-500 hover:bg-green-600 text-white" title="Freigeben" onClick={() => handleModerate(event._id, 'approved')}><Lock className="w-4 h-4" /></Button>
                                <Button size="icon" variant="destructive" title="Ablehnen" onClick={() => handleModerate(event._id, 'rejected')}><Trash2 className="w-4 h-4" /></Button>
                              </>
                            )}
                            <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: event._id, parentId: dayId })} title="Löschen"><Trash2 /></Button>
                                  </div>
                                </Card>
                              );
                    })
                        )}
                      </CardContent>
                    </Card>
                  );
          })}
                </div>
              )}
            {/* Bestätigungsdialog für Löschen */}
            <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirmDelete?.type === 'day' ? 'Diesen Tag und alle zugehörigen Events löschen?' : 'Dieses Event löschen?'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="destructive" onClick={async () => {
                if (confirmDelete?.type === 'event' && confirmDelete.parentId) {
                  await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                        setConfirmDelete(null);
                      }
                    }}>Löschen</Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
      {/* Modal für Tag anlegen */}
      {showDayModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Neuen Tag anlegen</h2>
            <input
              className="w-full border rounded px-3 py-2 mb-2"
                      placeholder="Titel"
                      value={dayForm.title}
                      onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                    />
            <textarea
              className="w-full border rounded px-3 py-2 mb-2"
                      placeholder="Beschreibung (optional)"
                      value={dayForm.description}
                      onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
            />
            <input
              className="w-full border rounded px-3 py-2 mb-4"
              type="date"
              value={dayForm.date ? new Date(dayForm.date).toISOString().slice(0,10) : ''}
              onChange={e => setDayForm(f => ({ ...f, date: e.target.value ? new Date(e.target.value) : null }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDayModal(false)} disabled={loading}>Abbrechen</Button>
              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSaveDay} disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Anlegen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineDesktop;