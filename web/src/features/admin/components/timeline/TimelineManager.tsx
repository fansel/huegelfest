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
import { useDeviceContext } from '@/shared/contexts/DeviceContext';
import AdminTimelineTab from './AdminTimelineTab';
import AdminCategoriesTab from './AdminCategoriesTab';
import type { Event as TimelineEvent } from '@/features/timeline/types/types';
import { getPendingEventsAction } from '@/features/timeline/actions/getPendingEventsAction';


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
const TimelineManager: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories' | 'pending'>('timeline');
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

  const isSavingDayRef = useRef(false);
  const isSavingEventRef = useRef(false);

  // Tag speichern
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
    } finally {
      setLoading(false);
      isSavingDayRef.current = false;
    }
  };

  // Event speichern
  const handleSaveEvent = async () => {
    if (isSavingEventRef.current) return;
    if (!eventForm.title || !eventForm.time || !eventForm.categoryId) {
      toast.error('Titel, Zeit und Kategorie sind erforderlich');
      return;
    }
    isSavingEventRef.current = true;
    setLoading(true);
    let prevEvents: any[] = [];
    let optimisticEvent: any = null;
    try {
      if (eventToEdit && eventDayId) {
        // Optimistisch: Event sofort im State aktualisieren
        prevEvents = eventsByDay[eventDayId] || [];
        optimisticEvent = {
          ...eventToEdit,
          ...eventForm,
          categoryId: eventForm.categoryId,
          dayId: eventDayId,
        };
        setEventsByDay(prev => ({ ...prev, [eventDayId]: prev[eventDayId].map(e => getIdString(e._id) === getIdString(eventToEdit._id) ? optimisticEvent : e) }));
        // Server-Request
        const eventId = typeof eventToEdit._id === 'string' ? eventToEdit._id : (eventToEdit._id as any)?.$oid ?? '';
        const result = await updateEvent(eventId, {
          time: eventForm.time,
          title: eventForm.title,
          description: eventForm.description,
          categoryId: eventForm.categoryId,
          dayId: eventDayId,
        });
        if (result && !result.error) {
          toast.success('Event aktualisiert');
        } else {
          // Rollback
          setEventsByDay(prev => ({ ...prev, [eventDayId]: prevEvents }));
          toast.error(result?.error || 'Fehler beim Aktualisieren des Events');
        }
      } else if (eventDayId) {
        // Optimistisch: Neues Event sofort im State anlegen
        prevEvents = eventsByDay[eventDayId] || [];
        optimisticEvent = {
          _id: 'optimistic-' + Math.random(),
          ...eventForm,
          categoryId: eventForm.categoryId,
          dayId: eventDayId,
          status: 'approved',
          submittedByAdmin: true,
        };
        setEventsByDay(prev => ({ ...prev, [eventDayId]: [...prev[eventDayId], optimisticEvent] }));
        // Server-Request
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
          // Ersetze das optimistische Event durch das echte
          setEventsByDay(prev => ({
            ...prev,
            [eventDayId]: prev[eventDayId].map(e => e._id === optimisticEvent._id ? result : e),
          }));
        } else {
          // Rollback
          setEventsByDay(prev => ({ ...prev, [eventDayId]: prevEvents }));
          toast.error(result?.error || 'Fehler beim Anlegen des Events');
        }
      }
      setShowEventModalOpen(false);
      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
      setFormType('event');
    } catch (err: any) {
      // Rollback
      if (eventDayId && prevEvents.length) setEventsByDay(prev => ({ ...prev, [eventDayId]: prevEvents }));
      console.error('[TimelineManager] Fehler beim Speichern des Events:', err);
      toast.error('Fehler beim Speichern des Events: ' + (err?.message || err));
    } finally {
      setLoading(false);
      isSavingEventRef.current = false;
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
    const prevEvents = eventsByDay[dayId] || [];
    // Optimistisch: Event sofort entfernen
    setEventsByDay(prev => ({ ...prev, [dayId]: prev[dayId].filter(e => getIdString(e._id) !== eventId) }));
    try {
      await removeEvent(eventId);
      toast.success('Event gelöscht');
      // Optional: Events für den Tag neu laden
      // const events = await fetchEventsByDayAdmin(dayId);
      // setEventsByDay(prev => ({ ...prev, [dayId]: events }));
    } catch (e: any) {
      // Rollback
      setEventsByDay(prev => ({ ...prev, [dayId]: prevEvents }));
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

  const { deviceType } = useDeviceContext();
  const isMobile = deviceType === 'mobile';
  const [formType, setFormType] = useState<'day' | 'event'>('event');

  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<{ id: string; name: string } | null>(null);

  // Hilfsfunktion zum Schließen und Zurücksetzen des Kategorie-Modals
  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditCategoryId(null);
    setCategoryForm({ name: '', color: '#ff9900', icon: '' });
  };

  // useEffect: Reset Category-Formular beim Schließen des Modals (mobil)
  useEffect(() => {
    if (!showCategoryModal) {
      setEditCategoryId(null);
      setCategoryForm({ name: '', color: '#ff9900', icon: '' });
    }
  }, [showCategoryModal]);

  // State für Sheet-Logik (mobil):
  const [showMobileSheet, setShowMobileSheet] = useState<null | 'event' | 'day'>(null);

  // useEffect: Reset Event/Tag-Formular beim Schließen des Sheets (mobil)
  useEffect(() => {
    if (!showMobileSheet) {
      setEditDayId(null);
      setDayForm({ title: '', description: '', date: null });
                                                      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
    }
  }, [showMobileSheet]);

  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<TimelineEvent[]>([]);

  const loadPendingEvents = async () => {
    setLoadingPending(true);
    try {
      const eventsRaw = await getPendingEventsAction();
      const events: TimelineEvent[] = Array.isArray(eventsRaw)
        ? eventsRaw.map(e => ({
            ...e,
            _id: typeof e._id === 'object' && e._id?.toString ? e._id.toString() : e._id,
            dayId: typeof e.dayId === 'object' && e.dayId?.toString ? e.dayId.toString() : e.dayId,
            categoryId: typeof e.categoryId === 'object' && e.categoryId?.toString ? e.categoryId.toString() : e.categoryId,
          }))
        : [];
      setPendingEvents(events);
    } catch (e: any) {
      toast.error(e?.message || 'Fehler beim Laden der Vorschläge');
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingEvents();
    }
  }, [activeTab]);

  const handleModeratePending = async (eventId: string, status: 'approved' | 'rejected') => {
    setLoadingPending(true);
    try {
      await moderateEvent(eventId, status);
      toast.success(status === 'approved' ? 'Event freigegeben' : 'Event abgelehnt');
      await loadPendingEvents();
    } catch (e: any) {
      toast.error(e?.message || 'Fehler bei Moderation');
    } finally {
      setLoadingPending(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'timeline' | 'categories' | 'pending')} className="mb-4 mt-2">
        <TabsList className="flex justify-center gap-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="categories">Kategorien</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          {activeTab === 'timeline' && (
            <AdminTimelineTab
              days={days}
              setDays={setDays}
              eventsByDay={eventsByDay}
              setEventsByDay={setEventsByDay}
              categories={categories}
              loading={loading}
              error={error}
            />
          )}
        </TabsContent>
        <TabsContent value="categories">
          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              setCategories={setCategories}
              loading={loading}
              error={error}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TimelineManager;