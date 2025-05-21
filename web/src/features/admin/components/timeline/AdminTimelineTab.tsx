import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { useWindowWidth } from '@/shared/hooks/useWindowWidth';
import { useDeviceContext, useDeviceType } from '@/shared/contexts/DeviceContext';
import toast from 'react-hot-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { createDayAction } from '@/features/timeline/actions/createDay';
import { updateDayAction } from '@/features/timeline/actions/updateDay';
import { removeDayAction } from '@/features/timeline/actions/removeDay';
import { createEvent } from '@/features/timeline/actions/createEvent';
import { updateEvent } from '@/features/timeline/actions/updateEvent';
import { removeEvent } from '@/features/timeline/actions/removeEvent';
import clsx from 'clsx';
import * as LucideIcons from 'lucide-react';

// Props-Interface ggf. anpassen
interface AdminTimelineTabProps {
  days: any[];
  setDays: (days: any[]) => void;
  eventsByDay: Record<string, any[]>;
  setEventsByDay: (events: Record<string, any[]>) => void;
  categories: any[];
  loading: boolean;
  error: string | null;
  // ... weitere Props nach Bedarf ...
}

// Hilfsfunktion: Tage alphabetisch sortieren
function sortDays(days: any[]) {
  return [...days].sort((a, b) => a.title.localeCompare(b.title, 'de', { sensitivity: 'base' }));
}
// Hilfsfunktion: Events nach Zeit (oder Titel) sortieren (optional)
function sortEvents(events: any[]) {
  return [...events].sort((a, b) => a.time?.localeCompare?.(b.time) || 0);
}

// Hilfsfunktion für dynamisches Icon
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

const AdminTimelineTab: React.FC<AdminTimelineTabProps> = ({ days, setDays, eventsByDay, setEventsByDay, categories, loading, error }) => {
  // --- State ---
  const [showDayModal, setShowDayModal] = useState(false);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState<{ title: string; description: string; date: Date | null }>({ title: '', description: '', date: null });
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState<{ time: string; title: string; description: string; categoryId: string }>({ time: '', title: '', description: '', categoryId: '' });
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [eventDayId, setEventDayId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [formType, setFormType] = useState<'day' | 'event'>('event');
  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const dayTitleRef = useRef<HTMLInputElement>(null);
  const eventTitleRef = useRef<HTMLInputElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [desktopFormTab, setDesktopFormTab] = useState<'day' | 'event'>('day');

  // --- Form Reset ---
  useEffect(() => {
    if (!showDayModal) {
      setEditDayId(null);
      setDayForm({ title: '', description: '', date: null });
    }
  }, [showDayModal]);
  useEffect(() => {
    if (!showEventModal) {
      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
    }
  }, [showEventModal]);

  // --- Focus Handling ---
  useEffect(() => {
    if (showDayModal && dayTitleRef.current && !isDatePickerOpen) {
      setTimeout(() => dayTitleRef.current?.focus(), 50);
    }
  }, [showDayModal, isDatePickerOpen]);
  useEffect(() => {
    if (showEventModal && eventTitleRef.current) {
      setTimeout(() => eventTitleRef.current?.focus(), 50);
    }
  }, [showEventModal]);

  // --- Handler: Tag ---
  const handleDayFormSubmit = async () => {
    if (!dayForm.title || !dayForm.date) {
      toast.error('Titel und Datum sind erforderlich');
      return;
    }
    if (editDayId) {
      await handleUpdateDay(editDayId, { title: dayForm.title, description: dayForm.description, date: dayForm.date });
    } else {
      await handleCreateDay({ title: dayForm.title, description: dayForm.description, date: dayForm.date });
    }
    setShowDayModal(false);
  };
  const handleEditDay = (day: any) => {
    setEditDayId(day._id);
    setDayForm({ title: day.title, description: day.description || '', date: day.date ? new Date(day.date) : null });
    setShowDayModal(true);
  };
  // --- Handler: Event ---
  const handleEditEvent = (event: any, dayId: string) => {
    setEventToEdit(event);
    setEventDayId(dayId);
    setEventForm({
      time: event.time,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId || (categories[0]?._id ?? ''),
    });
    if (!isMobile) setDesktopFormTab('event');
    setShowEventModal(isMobile);
  };
  const handleEventFormSubmit = async () => {
    if (!eventForm.title || !eventForm.time || !eventForm.categoryId) {
      toast.error('Titel, Zeit und Kategorie sind erforderlich');
      return;
    }
    if (eventToEdit && eventDayId) {
      await handleUpdateEvent(eventToEdit._id, { ...eventForm }, eventDayId);
    } else if (eventDayId) {
      await handleCreateEvent({ ...eventForm }, eventDayId);
    }
    if (isMobile) setShowEventModal(false);
    else setDesktopFormTab('day');
  };
  const handleCancelEventForm = () => {
    setEventToEdit(null);
    setEventDayId(null);
    setEventForm({ time: '', title: '', description: '', categoryId: '' });
    setDesktopFormTab('day');
  };

  // Kategorie-Auswahl im Event-Formular initialisieren, falls leer und Kategorien vorhanden
  useEffect(() => {
    if (showEventModal && categories.length > 0 && !eventForm.categoryId) {
      setEventForm(f => ({ ...f, categoryId: categories[0]._id }));
    }
  }, [showEventModal, categories, eventForm.categoryId]);

  // Optimistisches Hinzufügen eines Tages
  const handleCreateDay = async (dayForm: any) => {
    const optimisticDay = { ...dayForm, _id: 'optimistic-' + Math.random() };
    const prevDays = [...days];
    setDays(sortDays([optimisticDay, ...days]));
    try {
      const result = await createDayAction(dayForm);
      if (result && result.success && result.day) {
        setDays(sortDays([result.day, ...days]));
        toast.success('Tag angelegt');
      } else {
        setDays(prevDays);
        toast.error(result?.error || 'Fehler beim Anlegen des Tages');
      }
    } catch (err: any) {
      setDays(prevDays);
      toast.error(err?.message || 'Fehler beim Anlegen des Tages');
    }
  };

  // Optimistisches Bearbeiten eines Tages
  const handleUpdateDay = async (id: string, update: any) => {
    const prevDays = [...days];
    setDays(sortDays(days.map(day => day._id === id ? { ...day, ...update } : day)));
    try {
      const result = await updateDayAction(id, update);
      if (result && result.success && result.day) {
        setDays(sortDays(days.map(day => day._id === id ? result.day : day)));
        toast.success('Tag aktualisiert');
      } else {
        setDays(prevDays);
        toast.error(result?.error || 'Fehler beim Aktualisieren des Tages');
      }
    } catch (err: any) {
      setDays(prevDays);
      toast.error(err?.message || 'Fehler beim Aktualisieren des Tages');
    }
  };

  // Optimistisches Löschen eines Tages
  const handleDeleteDay = async (id: string) => {
    const prevDays = [...days];
    setDays(sortDays(days.filter(day => day._id !== id)));
    try {
      const result = await removeDayAction(id);
      if (result && result.success) {
        toast.success('Tag gelöscht');
      } else {
        setDays(prevDays);
        toast.error(result?.error || 'Fehler beim Löschen des Tages');
      }
    } catch (err: any) {
      setDays(prevDays);
      toast.error(err?.message || 'Fehler beim Löschen des Tages');
    }
  };

  // Optimistisches Hinzufügen eines Events
  const handleCreateEvent = async (eventForm: any, dayId: string) => {
    const optimisticEvent = { ...eventForm, _id: 'optimistic-' + Math.random() };
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({ ...eventsByDay, [dayId]: sortEvents([...prevEvents, optimisticEvent]) });
    try {
      const result = await createEvent({ ...eventForm, dayId });
      if (result && result._id) {
        setEventsByDay({ ...eventsByDay, [dayId]: sortEvents([...prevEvents, result]) });
        toast.success('Event angelegt');
      } else {
        setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
        toast.error('Fehler beim Anlegen des Events');
      }
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error(err?.message || 'Fehler beim Anlegen des Events');
    }
  };

  // Optimistisches Bearbeiten eines Events
  const handleUpdateEvent = async (eventId: string, update: any, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({ ...eventsByDay, [dayId]: sortEvents(prevEvents.map(ev => ev._id === eventId ? { ...ev, ...update } : ev)) });
    try {
      const result = await updateEvent(eventId, update);
      if (result && result._id) {
        setEventsByDay({ ...eventsByDay, [dayId]: sortEvents(prevEvents.map(ev => ev._id === eventId ? result : ev)) });
        toast.success('Event aktualisiert');
      } else {
        setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
        toast.error('Fehler beim Aktualisieren des Events');
      }
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error(err?.message || 'Fehler beim Aktualisieren des Events');
    }
  };

  // Optimistisches Löschen eines Events
  const handleDeleteEvent = async (eventId: string, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({ ...eventsByDay, [dayId]: sortEvents(prevEvents.filter(ev => ev._id !== eventId)) });
    try {
      await removeEvent(eventId);
      toast.success('Event gelöscht');
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error(err?.message || 'Fehler beim Löschen des Events');
    }
  };

  // --- Event bestätigen (pending -> approved) ---
  const handleApproveEvent = async (eventId: string, dayId: string) => {
    const prevEvents = eventsByDay[dayId] || [];
    setEventsByDay({
      ...eventsByDay,
      [dayId]: prevEvents.map(ev => ev._id === eventId ? { ...ev, status: 'approved' } : ev)
    });
    try {
      await updateEvent(eventId, { status: 'approved' });
      toast.success('Event bestätigt');
    } catch (err: any) {
      setEventsByDay({ ...eventsByDay, [dayId]: prevEvents });
      toast.error('Fehler beim Bestätigen');
    }
  };

  // ... UI-Rendering (mobil & desktop) ...
  if (isMobile) {
    return (
      <div className="max-w-lg mx-auto w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#460b6c] flex items-center gap-2">
            Timeline
            {/* Gelber Punkt, wenn mind. ein Tag ein pending Event hat */}
            {days.some(day => (eventsByDay[day._id] || []).some(ev => ev.status === 'pending' && !ev.submittedByAdmin)) && (
              <span className="ml-2 w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Unbestätigte Events"></span>
            )}
          </h3>
          <Button variant="default" size="icon" onClick={() => setShowDayModal(true)} aria-label="Neuer Tag" className="ml-2"><Plus /></Button>
        </div>
        {/* Liste der Tage und Events */}
        <ul className="space-y-4">
          {sortDays(days).map(day => {
            const hasPending = (eventsByDay[day._id] || []).some(ev => ev.status === 'pending' && !ev.submittedByAdmin);
            return (
            <li key={day._id} className="bg-white shadow rounded-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                      {day.title}
                      {hasPending && <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Unbestätigte Events"></span>}
                    </span>
                  <span className="text-xs text-gray-500">{day.date ? format(new Date(day.date), 'PPP', { locale: de }) : ''}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" size="icon" onClick={() => handleEditDay(day)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'day', id: day._id })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {/* Events */}
              <ul className="mt-2 space-y-2">
                {(eventsByDay[day._id] || []).map(event => {
                  const category = categories.find((cat) => cat._id === event.categoryId);
                  const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                  return (
                    <li key={event._id} className={clsx("flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 shadow-sm", event.status === 'pending' && !event.submittedByAdmin && 'border-l-4 border-yellow-400')}>
                      <div className="flex items-center gap-4">
                        <div className="bg-[#ff9900]/20 rounded-full p-3 flex items-center justify-center">
                          <IconComponent className="text-[#ff9900] text-4xl" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg text-gray-900">{event.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="inline h-4 w-4" />{event.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 items-center">
                        {event.status === 'pending' && !event.submittedByAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => handleApproveEvent(event._id, day._id)} aria-label="Bestätigen" title="Event bestätigen">
                            <Check className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        <Button variant="secondary" size="icon" onClick={() => handleEditEvent(event, day._id)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: event._id, parentId: day._id })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </li>
                  );})}
              </ul>
            </li>
          );})}
        </ul>
        {/* Floating-Button für neuen Tag */}
        <div className="mt-6 flex justify-center mb-6">
          <Button
            variant="default"
            size="lg"
            onClick={() => setShowDayModal(true)}
            aria-label="Neuen Tag anlegen"
            className="bg-[#ff9900] text-white border-2 border-white px-6 py-3 rounded-xl text-base font-semibold flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Tag hinzufügen
          </Button>
        </div>
        {/* Modal für Tag anlegen/bearbeiten */}
        <Sheet open={showDayModal} onOpenChange={setShowDayModal}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh]">
            <SheetHeader>
              <SheetTitle>{editDayId ? 'Tag bearbeiten' : 'Tag anlegen'}</SheetTitle>
            </SheetHeader>
            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8">
              <label htmlFor="day-title" className="text-sm font-medium text-gray-700">Titel</label>
              <Input
                id="day-title"
                placeholder="Titel"
                value={dayForm.title}
                onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full"
                autoFocus
                ref={dayTitleRef}
              />
              <label htmlFor="day-date" className="text-sm font-medium text-gray-700">Datum</label>
              <DatePicker
                value={dayForm.date ?? undefined}
                onChange={date => setDayForm(f => ({ ...f, date: date ?? null }))}
              />
              <label htmlFor="day-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
              <Textarea
                id="day-description"
                placeholder="Beschreibung (optional)"
                value={dayForm.description}
                onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                className="w-full"
                rows={2}
              />
              <SheetFooter>
                <Button variant="default" onClick={handleDayFormSubmit} disabled={loading} className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white">
                  {loading ? <Loader2 className="animate-spin" /> : (editDayId ? 'Speichern' : 'Anlegen')}
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
        {/* Modal für Event anlegen/bearbeiten */}
        <Sheet open={showEventModal} onOpenChange={setShowEventModal}>
          <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh] flex flex-col justify-between">
            <SheetHeader>
              <SheetTitle>{eventToEdit ? 'Event bearbeiten' : 'Event anlegen'}</SheetTitle>
            </SheetHeader>
            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8 flex-1 overflow-y-auto">
              <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
              <Input
                id="event-title"
                placeholder="Titel"
                value={eventForm.title}
                onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full"
                autoFocus
                ref={eventTitleRef}
              />
              <label htmlFor="event-time" className="text-sm font-medium text-gray-700">Zeit</label>
              <Input
                id="event-time"
                placeholder="z.B. 18:00"
                value={eventForm.time}
                onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                required
                className="w-full"
              />
              <label htmlFor="event-category" className="text-sm font-medium text-gray-700">Kategorie</label>
              <select
                id="event-category"
                value={eventForm.categoryId}
                onChange={e => setEventForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full border rounded px-2 py-1"
                required
              >
                <option value="" disabled>Kategorie wählen</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <label htmlFor="event-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
              <Textarea
                id="event-description"
                placeholder="Beschreibung (optional)"
                value={eventForm.description}
                onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                className="w-full"
                rows={2}
              />
            </div>
            <SheetFooter className="sticky bottom-0 bg-white/90 pt-4 pb-2">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleCancelEventForm}>Abbrechen</Button>
                <Button variant="default" onClick={handleEventFormSubmit} disabled={loading} className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white">
                  {loading ? <Loader2 className="animate-spin" /> : (eventToEdit ? 'Speichern' : 'Anlegen')}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {/* Delete-Dialog */}
        <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.type === 'day' ? 'Diesen Tag' : 'Dieses Event'} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#ff9900] text-white hover:bg-[#ffb84d] focus:ring-2 focus:ring-[#ff9900]"
                onClick={async () => {
                  if (confirmDelete?.type === 'day') await handleDeleteDay(confirmDelete.id);
                  if (confirmDelete?.type === 'event' && confirmDelete.parentId) await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                  setConfirmDelete(null);
                }}
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // --- Desktop ---
  if (!isMobile) {
    return (
      <div className="relative min-h-[60vh] pb-24 flex flex-col max-w-5xl mx-auto">
        {/* Header-Row */}
        <div className="flex flex-row items-center gap-8 mt-8 mb-6">
          <h2 className="text-2xl font-bold text-[#460b6c] flex-1">{desktopFormTab === 'event' ? (eventToEdit ? 'Event bearbeiten' : 'Neues Event') : (editDayId ? 'Tag bearbeiten' : 'Neuer Tag')}</h2>
          <h2 className="text-2xl font-bold text-[#460b6c] flex-1 text-center">Timeline</h2>
        </div>
        <div className="flex flex-row gap-8 justify-center items-start">
          {/* --- WICHTIG: Tabs für Tag/Event immer sichtbar --- */}
          <div className="w-full max-w-lg flex-shrink-0">
            <div className="bg-white/90 rounded-2xl shadow-2xl border-2 border-gray-200 p-6 sticky top-8">
              <Tabs value={desktopFormTab} onValueChange={v => setDesktopFormTab(v as 'day' | 'event')} className="w-full">
                <TabsList className="mb-4 w-full flex gap-2 justify-center">
                  <TabsTrigger value="day">Tag</TabsTrigger>
                  <TabsTrigger value="event">Event</TabsTrigger>
                </TabsList>
                <TabsContent value="day">
                  {/* Tag-Formular */}
                  <div className="flex flex-col gap-4">
                    <label htmlFor="day-title" className="text-sm font-medium text-gray-700">Titel</label>
                    <Input
                      id="day-title"
                      placeholder="Titel"
                      value={dayForm.title}
                      onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                      required
                      className="w-full"
                      autoFocus
                      ref={dayTitleRef}
                    />
                    <label htmlFor="day-date" className="text-sm font-medium text-gray-700">Datum</label>
                    <DatePicker
                      value={dayForm.date ?? undefined}
                      onChange={date => setDayForm(f => ({ ...f, date: date ?? null }))}
                    />
                    <label htmlFor="day-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
                    <Textarea
                      id="day-description"
                      placeholder="Beschreibung (optional)"
                      value={dayForm.description}
                      onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full"
                      rows={2}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="event">
                  {/* Event-Formular */}
                  <div className="flex flex-col gap-4">
                    <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
                    <Input
                      id="event-title"
                      placeholder="Titel"
                      value={eventForm.title}
                      onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                      required
                      className="w-full"
                      autoFocus
                      ref={eventTitleRef}
                    />
                    <label htmlFor="event-time" className="text-sm font-medium text-gray-700">Zeit</label>
                    <Input
                      id="event-time"
                      placeholder="z.B. 18:00"
                      value={eventForm.time}
                      onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                      required
                      className="w-full"
                    />
                    <label htmlFor="event-category" className="text-sm font-medium text-gray-700">Kategorie</label>
                    <select
                      id="event-category"
                      value={eventForm.categoryId}
                      onChange={e => setEventForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full border rounded px-2 py-1"
                      required
                    >
                      <option value="" disabled>Kategorie wählen</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <label htmlFor="event-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
                    <Textarea
                      id="event-description"
                      placeholder="Beschreibung (optional)"
                      value={eventForm.description}
                      onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full"
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          {/* Rechte Spalte: Liste der Tage und Events */}
          <div className="flex-1">
            <ul className="space-y-4">
              {sortDays(days).map(day => {
                const hasPending = (eventsByDay[day._id] || []).some(ev => ev.status === 'pending' && !ev.submittedByAdmin);
                return (
                <li key={day._id} className="bg-white shadow rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                          {day.title}
                          {hasPending && <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Unbestätigte Events"></span>}
                        </span>
                      <span className="text-xs text-gray-500">{day.date ? format(new Date(day.date), 'PPP', { locale: de }) : ''}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="icon" onClick={() => { setEditDayId(day._id); setDayForm({ title: day.title, description: day.description || '', date: day.date ? new Date(day.date) : null }); setDesktopFormTab('day'); }} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'day', id: day._id })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {/* Events */}
                  <ul className="mt-2 space-y-2">
                    {(eventsByDay[day._id] || []).map(event => {
                      const category = categories.find((cat) => cat._id === event.categoryId);
                      const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                      return (
                        <li key={event._id} className={clsx("flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 shadow-sm", event.status === 'pending' && !event.submittedByAdmin && 'border-l-4 border-yellow-400')}>
                          <div className="flex items-center gap-4">
                            <div className="bg-[#ff9900]/20 rounded-full p-3 flex items-center justify-center">
                              <IconComponent className="text-[#ff9900] text-4xl" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg text-gray-900">{event.title}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="inline h-4 w-4" />{event.time}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            {event.status === 'pending' && !event.submittedByAdmin && (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveEvent(event._id, day._id)} aria-label="Bestätigen" title="Event bestätigen">
                                <Check className="h-4 w-4 text-yellow-500" />
                              </Button>
                            )}
                            <Button variant="secondary" size="icon" onClick={() => handleEditEvent(event, day._id)} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: event._id, parentId: day._id })} aria-label="Löschen"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </li>
                      );})}
                  </ul>
                </li>
              );})}
            </ul>
          </div>
        </div>
        {/* Delete-Dialog */}
        <AlertDialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDelete?.type === 'day' ? 'Diesen Tag' : 'Dieses Event'} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#ff9900] text-white hover:bg-[#ffb84d] focus:ring-2 focus:ring-[#ff9900]"
                onClick={async () => {
                  if (confirmDelete?.type === 'day') await handleDeleteDay(confirmDelete.id);
                  if (confirmDelete?.type === 'event' && confirmDelete.parentId) await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                  setConfirmDelete(null);
                }}
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
};

export default AdminTimelineTab; 