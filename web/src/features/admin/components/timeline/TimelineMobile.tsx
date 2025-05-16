import React, { useState, useRef, useEffect } from 'react';
import type { TimelineData, Day, Event, Category } from '@/features/timeline/types/types';
import type { IDay } from '@/lib/db/models/Day';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Pen, Check, X, Pencil, Lock, Loader2, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import * as LucideIcons from 'lucide-react';
import { createCategoryAction } from '@/features/categories/actions/createCategory';
import { updateCategoryAction } from '@/features/categories/actions/updateCategory';
import { deleteCategoryAction } from '@/features/categories/actions/deleteCategory'
import tags from 'lucide-static/tags.json';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/shared/components/ui/accordion';
import { Badge } from '@/shared/components/ui/badge';
import { fetchDays } from '@/features/timeline/actions/fetchDays';
import { fetchEventsByDayAdmin } from '@/features/timeline/actions/fetchEventsByDayAdmin';
import { moderateEvent } from '@/features/timeline/actions/moderateEvent';
import { removeEvent } from '@/features/timeline/actions/removeEvent';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { createDayAction } from '@/features/timeline/actions/createDay';
import { updateDayAction } from '@/features/timeline/actions/updateDay';
import { removeDayAction } from '@/features/timeline/actions/removeDay';
import { createEvent } from '@/features/timeline/actions/createEvent';
import { updateEvent } from '@/features/timeline/actions/updateEvent';
import { Popover as HeadlessPopover } from '@headlessui/react';

console.log('TimelineMobile render');

// Typ für neuen Tag (ohne Mongoose-Methoden)
type NewDay = { title: string; description?: string; date: Date };

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      className={clsx('w-full', isDragging && 'z-50')}
    >
      {children}
    </div>
  );
}

function InlineInput({ value, onChange, onBlur, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (v: string) => Promise<void> | void }) {
  const [editValue, setEditValue] = useState<string>(value);

  // Hilfsfunktion, um asynchrone onChange zu unterstützen
  const handleBlur = async () => {
    await onChange(editValue);
    if (onBlur) onBlur({} as any);
  };

  return (
    <input
      className={clsx('border rounded px-2 py-1 text-sm', className)}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      {...props}
    />
  );
}

function getIdString(id: any) {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && ('$oid' in id)) return id.$oid;
  return String(id);
}

// Kategorie-Dropdown mit Autocomplete
function CategorySelect({
  categories,
  value,
  onChange,
  disabled
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="input input-bordered input-xs w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      required
    >
      <option value="" disabled>Kategorie wählen</option>
      {categories.map(cat => (
        <option key={cat._id} value={cat._id}>
          {cat.label || cat.name}
        </option>
      ))}
    </select>
  );
}

// Hilfsfunktion für dynamisches Icon
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

function toPascalCase(kebab: string) {
  return kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Mobile-Variante des Timeline-Editors für Admins
 */
const TimelineMobile: React.FC = () => {
  const [days, setDays] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [eventsByDay, setEventsByDay] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // State für Tag-Formular
  const [dayForm, setDayForm] = useState<{ title: string; description: string; date: Date | null }>({ title: '', description: '', date: null });
  // State für Event-Formular
  const [eventForm, setEventForm] = useState<{ time: string; title: string; description: string; categoryId: string }>({ time: '', title: '', description: '', categoryId: '' });

  const [showEventModalOpen, setShowEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventDayId, setEventDayId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // 1. State für Tab-Bar
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories'>('timeline');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ name: string; color: string; icon: string }>({ name: '', color: '#ff9900', icon: '' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [iconPage, setIconPage] = useState(0);
  const ICONS_PER_PAGE = 24;

  const iconList = Object.entries(tags).map(([name, tags]) => ({ name, tags: tags as string[] }));

  const filteredIcons = iconList.filter((icon: { name: string; tags: string[] }) => {
    const term = iconSearch.toLowerCase();
    return (
      icon.name.toLowerCase().includes(term) ||
      icon.tags.some((tag: string) => tag.toLowerCase().includes(term))
    );
  });
  const pageCount = Math.ceil(filteredIcons.length / ICONS_PER_PAGE);
  const pagedIcons = filteredIcons.slice(iconPage * ICONS_PER_PAGE, (iconPage + 1) * ICONS_PER_PAGE);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    let fromDayId: string | undefined;
    let toDayId: string | undefined;
    const eventId = active.id as string;
    days.forEach(day => {
      const dayId = getIdString(day._id);
      if (eventsByDay[dayId].some(e => getIdString(e._id) === eventId)) {
        fromDayId = dayId;
      }
      if (over.data.current?.sortable?.containerId === dayId) {
        toDayId = dayId;
      }
    });
    if (fromDayId && toDayId && fromDayId !== toDayId) {
      // Implement the logic to move the event from one day to another
      toast.success('Event verschoben');
    }
  };

  // Tag anlegen/bearbeiten Modal öffnen
  const openDayForm = (day?: Day) => {
    if (day) {
      setDayForm({
        title: day.title,
        description: day.description || '',
        date: day.date ? new Date(day.date) : null,
      });
    } else {
      setDayForm({ title: '', description: '', date: null });
    }
    setShowDayModal(true);
  };

  // Tag speichern
  const handleSaveDay = async () => {
    if (!dayForm.title || !dayForm.date) {
      toast.error('Titel und Datum sind erforderlich');
      return;
    }
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
        const newDay: NewDay = {
          title: dayForm.title,
          description: dayForm.description,
          date: dayForm.date as Date,
        };
        const result = await createDayAction(newDay);
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
    }
  };

  // Event speichern
  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.time || !eventForm.categoryId) {
      toast.error('Titel, Zeit und Kategorie sind erforderlich');
      return;
    }
    try {
      if (eventToEdit && eventDayId) {
        const eventId = typeof eventToEdit._id === 'string'
          ? eventToEdit._id
          : (eventToEdit._id as any)?.$oid ?? '';
        const result = await updateEvent(eventId, {
          time: eventForm.time,
          title: eventForm.title,
          description: eventForm.description,
          categoryId: eventForm.categoryId,
          dayId: eventDayId,
        });
        if (result && !result.error) {
          toast.success('Event aktualisiert');
          // Events für den Tag neu laden
          const events = await fetchEventsByDayAdmin(eventDayId);
          setEventsByDay(prev => ({ ...prev, [eventDayId]: events }));
        } else {
          toast.error(result?.error || 'Fehler beim Aktualisieren des Events');
        }
      } else if (eventDayId) {
        // Neues Event anlegen
        const result = await createEvent({
          dayId: eventDayId,
          time: eventForm.time,
          title: eventForm.title,
          description: eventForm.description,
          categoryId: eventForm.categoryId,
          status: 'approved',
          submittedByAdmin: true,
        });
        if (result && !result.error) {
          toast.success('Event angelegt');
          // Events für den Tag neu laden
          const events = await fetchEventsByDayAdmin(eventDayId);
          setEventsByDay(prev => ({ ...prev, [eventDayId]: events }));
        } else {
          toast.error(result?.error || 'Fehler beim Anlegen des Events');
        }
      }
      setShowEventModalOpen(false);
      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
    } catch (err: any) {
      console.error('[TimelineMobile] Fehler beim Speichern des Events:', err);
      toast.error('Fehler beim Speichern des Events: ' + (err?.message || err));
    }
  };

  console.log('showEventModalOpen', showEventModalOpen);

  const dayTitleRef = useRef<HTMLInputElement>(null);
  const eventTitleRef = useRef<HTMLInputElement>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (showDayModal && dayTitleRef.current && !isDatePickerOpen) {
      setTimeout(() => {
        dayTitleRef.current?.focus();
      }, 50);
    }
  }, [showDayModal, isDatePickerOpen]);

  useEffect(() => {
    if (showEventModalOpen && eventTitleRef.current) {
      eventTitleRef.current.focus();
    }
  }, [showEventModalOpen]);

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

  useEffect(() => {
    if (
      showEventModalOpen &&
      categories.length > 0 &&
      (!eventForm.categoryId || !categories.some(cat => getIdString(cat._id) === eventForm.categoryId))
    ) {
      setEventForm(f => ({
        ...f,
        categoryId: getIdString(categories[0]._id),
      }));
    }
  }, [showEventModalOpen, categories, eventForm.categoryId]);

  useEffect(() => {
    if (
      showEventModalOpen &&
      categories.length > 0 &&
      eventForm.categoryId &&
      categories.some(cat => getIdString(cat._id) === eventForm.categoryId) &&
      eventTitleRef.current
    ) {
      setTimeout(() => {
        eventTitleRef.current?.focus();
      }, 50);
    }
  }, [showEventModalOpen, categories, eventForm.categoryId]);

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

  // Ref für den zuletzt offenen Tag
  const prevOpenDayRef = useRef<string | null>(null);

  const handleDeleteEvent = async (eventId: string, dayId: string) => {
    setLoading(true);
    prevOpenDayRef.current = openDay;
    try {
      await removeEvent(eventId);
      toast.success('Event gelöscht');
      // Tage und Events neu laden
      const daysRes = await fetchDays();
      setDays(daysRes);
      const eventsObj: Record<string, any[]> = {};
      for (const day of daysRes) {
        const events = await fetchEventsByDayAdmin(getIdString(day._id));
        eventsObj[getIdString(day._id)] = events;
      }
      setEventsByDay(eventsObj);
    } catch (e: any) {
      toast.error(e?.message || 'Fehler beim Löschen');
    } finally {
      setLoading(false);
    }
  };

  // Setze openDay nach dem Neuladen der Tage, falls der Tag noch existiert
  useEffect(() => {
    if (prevOpenDayRef.current && days.some(day => getIdString(day._id) === prevOpenDayRef.current)) {
      setOpenDay(prevOpenDayRef.current);
      prevOpenDayRef.current = null;
    }
  }, [days]);

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

  return (
    <>
      <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
        <h2 className="text-2xl font-bold mb-4 text-[#460b6c] text-center tracking-tight drop-shadow-sm">Timeline-Editor (Mobil)</h2>
        {/* Timeline-Tab: Ladezustand */}
        {(loading || categories.length === 0) ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#ff9900] text-3xl" />
          </div>
        ) : (
          <>
            {/* Tab-Bar nur hier! */}
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'timeline' | 'categories')} className="mb-4 mt-2">
              <TabsList className="flex justify-center gap-2">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="categories">Kategorien</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                {error && <div className="text-red-500">{error}</div>}
                {/* Timeline-Ansicht */}
                {activeTab === 'timeline' && (
                  <>
                    <Accordion type="single" collapsible className="flex flex-col gap-6">
                      {days.length ? (
                        days.map(day => {
                          const dayId = getIdString(day._id);
                          const isOpen = openDay === dayId;
                          const events = eventsByDay[dayId] || [];
                          return (
                            <AccordionItem value={dayId} key={dayId} className="border-none bg-transparent">
                              <Card className={`transition-all ${isOpen ? 'shadow-xl hover:shadow-2xl bg-white/90' : 'shadow-sm bg-white/70'} border-0 backdrop-blur-md` }>
                                <AccordionTrigger
                                  className="flex items-center justify-between px-6 py-4 gap-4 rounded-2xl hover:bg-gray-50/80 transition-all"
                                  onClick={() => setOpenDay(isOpen ? null : dayId)}
                                  aria-expanded={isOpen}
                                >
                                  <div className="flex-1 min-w-0 flex flex-row items-center gap-2">
                                    <span className="font-bold text-lg text-[#460b6c] truncate">{day.title}</span>
                                    <span className="text-sm text-gray-500 font-medium ml-auto whitespace-nowrap">{day.date ? format(new Date(day.date), 'EEE, dd.MM.yyyy', { locale: de }) : ''}</span>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <button
                                      onClick={e => { e.stopPropagation(); setEditDayId(dayId); openDayForm(day); }}
                                      className="rounded-full bg-blue-50 hover:bg-blue-200 w-8 h-8 flex items-center justify-center text-blue-600 border border-blue-100"
                                      title="Tag bearbeiten"
                                      aria-label="Tag bearbeiten"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={async e => { e.stopPropagation(); if (window.confirm('Diesen Tag wirklich löschen?')) { await handleDeleteDay(dayId); } }}
                                      className="rounded-full bg-red-50 hover:bg-red-200 w-8 h-8 flex items-center justify-center text-red-600 border border-red-100"
                                      title="Tag löschen"
                                      aria-label="Tag löschen"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 pt-2">
                                  <div className="flex flex-col gap-4">
                                    {events.map(event => {
                                      const eventId = getIdString(event._id);
                                      const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                                      const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                                      return (
                                        <Card key={eventId} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow border-0 bg-white/95 hover:shadow-lg transition-all">
                                          <span className="flex-shrink-0">
                                            {IconComponent && <IconComponent className="text-xl" style={{ color: category?.color || '#ff9900' }} />}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate text-base flex items-center gap-2">
                                              {event.title}
                                              {/* Status-Badge */}
                                              {event.status === 'pending' && <Badge className="bg-yellow-400 text-white ml-2">Ausstehend</Badge>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                                              <Badge style={{ background: category?.color || '#ff9900', color: '#fff' }} className="px-2 py-0.5 text-xs font-medium rounded">{category?.label || category?.name || 'Kategorie'}</Badge>
                                              <span>{event.time}</span>
                                              {event.description && <span className="text-gray-400">· {event.description}</span>}
                                            </div>
                                            {/* Feld: Angeboten von */}
                                            {event.offeredBy && <div className="text-xs text-[#460b6c] mt-1">Angeboten von: <span className="font-semibold">{event.offeredBy}</span></div>}
                                          </div>
                                          <div className="flex gap-1 items-center ml-2">
                                            {/* Approve/Reject für pending */}
                                            {event.status === 'pending' && (
                                              <Button size="icon" variant="outline" title="Freigeben" onClick={() => handleModerate(event._id, 'approved')}><Check className="w-4 h-4" /></Button>
                                            )}
                                            <button
                                              onClick={() => {
                                                if (!eventId || !dayId) {
                                                  toast.error('Fehlende Event- oder Tag-ID!');
                                                  return;
                                                }
                                                setConfirmDelete({ type: 'event', id: eventId, parentId: dayId });
                                              }}
                                              className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                                              title="Löschen"
                                              aria-label="Löschen"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (!dayId || !event) {
                                                  toast.error('Fehlende Event- oder Tag-ID!');
                                                  return;
                                                }
                                                setEventToEdit(event);
                                                setEventDayId(dayId);
                                                setEventForm({
                                                  time: event.time,
                                                  title: event.title,
                                                  description: event.description,
                                                  categoryId: typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || '',
                                                });
                                                setShowEventModalOpen(true);
                                              }}
                                              className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                                              title="Bearbeiten"
                                              aria-label="Bearbeiten"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </button>
                                            {/* Zu Tag verschieben Button */}
                                            <HeadlessPopover className="relative">
                                              <HeadlessPopover.Button className="rounded-full bg-gray-50 hover:bg-gray-200 w-8 h-8 flex items-center justify-center text-gray-600 border border-gray-100" title="Zu Tag verschieben" aria-label="Zu Tag verschieben">
                                                <ArrowRight className="h-4 w-4" />
                                              </HeadlessPopover.Button>
                                              <HeadlessPopover.Panel className="absolute z-10 mt-2 left-0 bg-white border rounded shadow p-2 w-48">
                                                <div className="text-xs font-semibold mb-2 text-gray-700">Zu Tag verschieben:</div>
                                                <ul className="space-y-1">
                                                  {days.filter(d => getIdString(d._id) !== dayId).map(d => (
                                                    <li key={getIdString(d._id)}>
                                                      <button
                                                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 text-sm"
                                                        onClick={async () => {
                                                          await updateEvent(eventId, { dayId: getIdString(d._id) });
                                                          toast.success('Event verschoben');
                                                          // Events für beide Tage neu laden
                                                          const eventsFrom = await fetchEventsByDayAdmin(dayId);
                                                          const eventsTo = await fetchEventsByDayAdmin(getIdString(d._id));
                                                          setEventsByDay(prev => ({ ...prev, [dayId]: eventsFrom, [getIdString(d._id)]: eventsTo }));
                                                        }}
                                                      >
                                                        {d.title} ({d.date ? format(new Date(d.date), 'dd.MM.yyyy', { locale: de }) : ''})
                                                      </button>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </HeadlessPopover.Panel>
                                            </HeadlessPopover>
                                          </div>
                                        </Card>
                                      );
                                    })}
                                    {/* Event hinzufügen Button (nur Icon, klein) */}
                                    <div className="flex justify-center mt-2">
                                      <button
                                        onClick={() => {
                                          if (categories.length === 0) return;
                                          setEventToEdit(null);
                                          setEventDayId(dayId);
                                          setEventForm({
                                            time: '',
                                            title: '',
                                            description: '',
                                            categoryId: getIdString(categories[0]._id),
                                          });
                                          setShowEventModalOpen(true);
                                        }}
                                        aria-label="Event hinzufügen"
                                        className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white border-2 border-white shadow rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition"
                                      >
                                        <Plus className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </Card>
                            </AccordionItem>
                          );
                        })
                      ) : (
                        <div className="text-gray-400 italic p-8 w-full text-center">
                          {loading ? 'Lade Timeline..' : 'Noch keine Tage vorhanden.'}
                        </div>
                      )}
                    </Accordion>
                    {/* Plus-Button zentriert unter der Timeline-Liste (nur Icon, klein) */}
                    <div className="flex justify-center mt-4 mb-8">
                      <button
                        onClick={() => { setEditDayId(null); setDayForm({ title: '', description: '', date: null }); setShowDayModal(true); }}
                        aria-label="Tag anlegen"
                        className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white border-2 border-white shadow rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Bestätigungsdialog für Löschen */}
                    {confirmDelete && (
                      <AlertDialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Wirklich löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                            {confirmDelete.type === 'day' ? 'Diesen Tag und alle zugehörigen Events löschen?' : 'Dieses Event löschen?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Abbrechen</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button variant="destructive" onClick={async () => {
                                try {
                                  if (confirmDelete.type === 'day') {
                                    // Implement the logic to remove the day
                                    toast.success('Tag gelöscht');
                                  } else if (confirmDelete.type === 'event' && confirmDelete.parentId) {
                                    await handleDeleteEvent(confirmDelete.id, confirmDelete.parentId);
                                  }
                                  setConfirmDelete(null);
                                } catch (err: any) {
                                  toast.error('Fehler beim Löschen: ' + (err?.message || err));
                                }
                              }}>Löschen</Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {/* Modal für Tag anlegen/bearbeiten */}
                    {showDayModal && (
                      <Sheet open={showDayModal} onOpenChange={(open) => { setShowDayModal(open); if (!open) setEditDayId(null); }}>
                        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[70vh]">
                          <SheetHeader>
                            <SheetTitle>{editDayId ? 'Tag bearbeiten' : 'Tag anlegen'}</SheetTitle>
                          </SheetHeader>
                          <div className="flex flex-col gap-6 items-center justify-center py-8">
                            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4">
                              <label htmlFor="day-title" className="text-sm font-medium text-gray-700">Titel</label>
                              <Input
                                id="day-title"
                                ref={dayTitleRef}
                              placeholder="Titel"
                              value={dayForm.title}
                              onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                              required
                                className="w-full"
                            />
                              <label htmlFor="day-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
                              <Textarea
                                id="day-description"
                              placeholder="Beschreibung (optional)"
                              value={dayForm.description}
                              onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                              rows={2}
                                className="w-full"
                              />
                              <label htmlFor="day-date" className="text-sm font-medium text-gray-700">Datum</label>
                              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="day-date">
                                    {dayForm.date ? format(dayForm.date, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={dayForm.date ?? undefined}
                                    onSelect={date => { setDayForm(f => ({ ...f, date: date ?? null })); setIsDatePickerOpen(false); }}
                                    locale={de}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
                              <Button variant="secondary" onClick={() => { setShowDayModal(false); setEditDayId(null); }}>Abbrechen</Button>
                              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSaveDay}>{editDayId ? 'Speichern' : 'Anlegen'}</Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    )}
                    {/* Modal für Event anlegen/bearbeiten */}
                    {showEventModalOpen && (
                      <Sheet open={showEventModalOpen} onOpenChange={(open) => { setShowEventModalOpen(open); if (!open) { setEventToEdit(null); setEventDayId(null); } }}>
                        <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[80vh]">
                          <SheetHeader>
                            <SheetTitle>{eventToEdit ? 'Event bearbeiten' : 'Event anlegen'}</SheetTitle>
                          </SheetHeader>
                          <div className="flex flex-col gap-6 items-center justify-center py-8">
                            <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4">
                              <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
                              <Input
                                id="event-title"
                                ref={eventTitleRef}
                              placeholder="Titel"
                              value={eventForm.title}
                              onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                              required
                                className="w-full"
                              />
                              <label htmlFor="event-time" className="text-sm font-medium text-gray-700">Uhrzeit</label>
                              <Input
                                id="event-time"
                              type="time"
                                placeholder="--:--"
                              value={eventForm.time}
                              onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                              required
                                className="w-full"
                            />
                              <label htmlFor="event-description" className="text-sm font-medium text-gray-700">Beschreibung</label>
                              <Textarea
                                id="event-description"
                              placeholder="Beschreibung (optional)"
                              value={eventForm.description}
                              onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                              rows={2}
                                className="w-full"
                            />
                              <label htmlFor="event-category" className="text-sm font-medium text-gray-700">Kategorie</label>
                              {categories.length > 0 && eventForm.categoryId && categories.some(cat => getIdString(cat._id) === eventForm.categoryId) ? (
                                <Select
                              value={eventForm.categoryId}
                                  onValueChange={v => setEventForm(f => ({ ...f, categoryId: v }))}
                              disabled={categories.length === 0}
                                  required
                                >
                                  <SelectTrigger className="w-full" id="event-category">
                                    <SelectValue>
                                      {categories.find(cat => getIdString(cat._id) === eventForm.categoryId)?.label ||
                                        categories.find(cat => getIdString(cat._id) === eventForm.categoryId)?.name ||
                                        'Kategorie wählen'}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat._id} value={getIdString(cat._id)}>
                                        {cat.label || cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="text-xs text-red-500 mt-2">Bitte zuerst eine Kategorie anlegen.</div>
                              )}
                              <label htmlFor="event-day" className="text-sm font-medium text-gray-700">Tag</label>
                              <select
                                id="event-day"
                                className="w-full border rounded px-2 py-1 text-sm mb-2"
                                value={eventDayId || ''}
                                onChange={e => setEventDayId(e.target.value)}
                              >
                                {days.map(day => (
                                  <option key={getIdString(day._id)} value={getIdString(day._id)}>
                                    {day.title} ({day.date ? format(new Date(day.date), 'dd.MM.yyyy', { locale: de }) : ''})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
                              <Button variant="secondary" onClick={() => { setShowEventModalOpen(false); setEventToEdit(null); setEventDayId(null); }}>Abbrechen</Button>
                              <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSaveEvent}>Speichern</Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="categories">
                <div className="max-w-lg mx-auto w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#460b6c]">Kategorien</h3>
                  </div>
                  <ul className="space-y-3">
                    {categories.map(cat => (
                      <li key={cat._id} className="bg-white shadow rounded-xl px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="rounded-full border-2 border-white shadow p-2 bg-gray-50">{(() => { const IconComponent = getIconComponent(cat.icon); return <IconComponent className="text-2xl" style={{ color: cat.color }} />; })()}</span>
                          <span className="font-medium text-gray-800 truncate">{cat.name}</span>
                        </div>
                        {cat.isDefault && <span className="ml-auto flex-shrink-0 text-gray-400" title="Standard-Kategorie"><Lock /></span>}
                        {!cat.isDefault && (
                          <div className="flex gap-1 ml-2">
                            <button onClick={() => { setEditCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon }); setShowCategoryModal(true); }} className="rounded-full bg-blue-50 hover:bg-blue-200 w-8 h-8 flex items-center justify-center text-blue-600 border border-blue-100"><Pencil /></button>
                            <button onClick={async () => { await deleteCategoryAction(cat._id); }} className="rounded-full bg-red-50 hover:bg-red-200 w-8 h-8 flex items-center justify-center text-red-600 border border-red-100"><Trash2 /></button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* Floating-Button unten zum Kategorie anlegen */}
                  <div className="mt-6 flex justify-center mb-6">
                    <button
                      onClick={() => { setShowCategoryModal(true); setEditCategoryId(null); setCategoryForm({ name: '', color: '#ff9900', icon: '' }); }}
                      className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                      aria-label="Neue Kategorie anlegen"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {/* Modal für Kategorie anlegen/bearbeiten */}
                  {showCategoryModal && (
                    <Sheet open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                      <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-3xl h-[60vh]">
                        <SheetHeader>
                          <SheetTitle>{editCategoryId ? 'Kategorie bearbeiten' : 'Kategorie anlegen'}</SheetTitle>
                        </SheetHeader>
                        <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-4 py-8">
                          <label htmlFor="category-name" className="text-sm font-medium text-gray-700">Name</label>
                          <Input
                            id="category-name"
                            placeholder="Name"
                            value={categoryForm.name}
                            onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                            required
                            className="w-full"
                            autoFocus
                          />
                          <label htmlFor="category-icon" className="text-sm font-medium text-gray-700">Icon</label>
                          <input type="text" placeholder="Icon suchen..." className="border-b border-gray-200 px-2 py-1 mb-2 w-full" value={iconSearch} onChange={e => { setIconSearch(e.target.value); setIconPage(0); }} id="category-icon" />
                          <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                            {pagedIcons.map((icon: { name: string; tags: string[] }) => {
                              const Icon = (LucideIcons as any)[toPascalCase(icon.name)];
                              if (!Icon) return null;
                              return (
                                <button key={icon.name} className={`rounded p-1 border ${categoryForm.icon === toPascalCase(icon.name) ? 'border-[#ff9900] bg-[#ff9900]/10' : 'border-transparent'}`} onClick={() => setCategoryForm(f => ({ ...f, icon: toPascalCase(icon.name) }))}><Icon className="text-2xl" title={icon.name} /></button>
                              );
                            })}
                          </div>
                          <div className="flex justify-end gap-2 px-6 pb-6 pt-2">
                            <Button className="bg-[#ff9900] hover:bg-orange-600 w-full" onClick={async () => {
                              if (!categoryForm.name || !categoryForm.icon) return;
                              if (editCategoryId) {
                                await updateCategoryAction(editCategoryId, { name: categoryForm.name, color: '#ff9900', icon: categoryForm.icon });
                              } else {
                                await createCategoryAction({ name: categoryForm.name, color: '#ff9900', icon: categoryForm.icon });
                              }
                              setShowCategoryModal(false);
                            }}>{editCategoryId ? 'Speichern' : 'Anlegen'}</Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
};

export default TimelineMobile; 