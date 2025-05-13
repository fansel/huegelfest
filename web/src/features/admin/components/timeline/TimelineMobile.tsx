import React, { useState, useRef, useEffect } from 'react';
import type { TimelineData, Day, Event, Category } from '@/features/timeline/types/types';
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
import { Plus, Trash2, Pen, Check, X, Pencil, Lock, Loader2, Clock } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import Datepicker from 'react-tailwindcss-datepicker';
import * as LucideIcons from 'lucide-react';
import { createCategoryAction } from '@/features/categories/actions/createCategory';
import { updateCategoryAction } from '@/features/categories/actions/updateCategory';
import { deleteCategoryAction } from '@/features/categories/actions/deleteCategory'
import tags from 'lucide-static/tags.json';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { de } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

console.log('TimelineMobile render');

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

function getIdString(id: string | { $oid: string } | undefined): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id) return id.$oid;
  return '';
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
  const {
    timeline,
    loading,
    error,
    refetch,
    createDay,
    removeDay,
    updateDay,
    createEvent,
    removeEvent,
    moveEvent,
    updateEvent,
    categories,
    categoriesLoading,
    categoriesError,
    fetchCategories,
  } = useTimeline();

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);

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
    timeline?.days.forEach(day => {
      const dayId = getIdString(day._id);
      if (day.events.some(e => getIdString(e._id) === eventId)) {
        fromDayId = dayId;
      }
      if (over.data.current?.sortable?.containerId === dayId) {
        toDayId = dayId;
      }
    });
    if (fromDayId && toDayId && fromDayId !== toDayId) {
      await moveEvent(fromDayId, toDayId, eventId);
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
        await updateDay(editDayId, { ...timeline!.days.find(d => getIdString(d._id) === editDayId)!, ...dayForm, date: dayForm.date });
        toast.success('Tag aktualisiert');
        setEditDayId(null);
      } else {
        await createDay({ title: dayForm.title, description: dayForm.description, date: dayForm.date, events: [] });
        toast.success('Tag angelegt');
      }
      setShowDayModal(false);
      setDayForm({ title: '', description: '', date: null });
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
        const dayId = getIdString(eventDayId);
        const eventId = getIdString(eventToEdit._id);
        console.log('[TimelineMobile] updateEvent:', { dayId, eventId, eventForm });
        await updateEvent(dayId, { ...eventToEdit, ...eventForm });
        toast.success('Event aktualisiert');
        await refetch();
      } else if (eventDayId) {
        const dayId = getIdString(eventDayId);
        console.log('[TimelineMobile] createEvent:', { dayId, eventForm });
        await createEvent(dayId, { ...eventForm });
        toast.success('Event angelegt');
        await refetch();
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
    fetchCategories();
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

  return (
    <>
      <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
        <h2 className="text-2xl font-bold mb-4 text-[#460b6c] text-center tracking-tight drop-shadow-sm">Timeline-Editor (Mobil)</h2>
        {/* Timeline-Tab: Ladezustand */}
        {(loading || categoriesLoading) ? (
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
                {categoriesError && <div className="text-red-500">{categoriesError}</div>}
                {/* Timeline-Ansicht */}
                {activeTab === 'timeline' && (
                  <>
                    <Accordion type="single" collapsible className="flex flex-col gap-6">
                      {timeline?.days?.length ? (
                        timeline.days.map(day => {
                          const dayId = getIdString(day._id);
                          const isOpen = openDay === dayId;
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
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4 pt-2">
                                  <div className="flex flex-col gap-4">
                                  {day.events.map(event => {
                                    const eventId = getIdString(event._id);
                                    const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                                    const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                                    return (
                                        <Card key={eventId} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow border-0 bg-white/95 hover:shadow-lg transition-all">
                                          <span className="flex-shrink-0">
                                            {IconComponent && <IconComponent className="text-xl" style={{ color: category?.color || '#ff9900' }} />}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate text-base">{event.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                                              <Badge style={{ background: category?.color || '#ff9900', color: '#fff' }} className="px-2 py-0.5 text-xs font-medium rounded">{category?.label || category?.name || 'Kategorie'}</Badge>
                                              <span>{event.time}</span>
                                              {event.description && <span className="text-gray-400">· {event.description}</span>}
                                            </div>
                                          </div>
                                          <div className="flex gap-1 items-center ml-2">
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
                                        </div>
                                        </Card>
                                    );
                                  })}
                                    <div className="mt-4 flex flex-col items-center">
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
                                      className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                                      aria-label="Neues Event anlegen"
                                        disabled={categories.length === 0}
                                      >
                                        <Plus className="h-5 w-5" />
                                      </button>
                                      {categories.length === 0 && (
                                        <div className="text-xs text-red-500 mt-2">Bitte zuerst eine Kategorie anlegen.</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-center mt-6">
                                    <button
                                      onClick={() => { setEditDayId(dayId); openDayForm(day); }}
                                      className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                                      title="Tag bearbeiten"
                                      aria-label="Tag bearbeiten"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: 'day', id: dayId })}
                                      className="rounded-full p-2 hover:bg-red-100 active:bg-red-200 transition"
                                      title="Tag löschen"
                                    >
                                      <Trash2 className="w-5 h-5 text-red-500" />
                                    </button>
                                  </div>
                                </AccordionContent>
                              </Card>
                            </AccordionItem>
                          );
                        })
                      ) : (
                        <div className="text-gray-400 italic p-8 w-full text-center">
                          {loading ? 'Lade Timeline...' : 'Noch keine Tage vorhanden.'}
                        </div>
                      )}
                    </Accordion>
                    {/* Tag anlegen Floating-Button */}
                    <div className="mt-6 flex justify-center mb-6">
                      <button
                        onClick={() => openDayForm()}
                        className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                        aria-label="Neuen Tag anlegen"
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
                                    await removeDay(confirmDelete.id);
                                    toast.success('Tag gelöscht');
                                    await refetch();
                                  } else if (confirmDelete.type === 'event' && confirmDelete.parentId) {
                                    const dayId = getIdString(confirmDelete.parentId);
                                    const eventId = getIdString(confirmDelete.id);
                                    await removeEvent(dayId, eventId);
                                    toast.success('Event gelöscht');
                                    await refetch();
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
                              disabled={categoriesLoading}
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
                            <button onClick={async () => { await deleteCategoryAction(cat._id); fetchCategories(); }} className="rounded-full bg-red-50 hover:bg-red-200 w-8 h-8 flex items-center justify-center text-red-600 border border-red-100"><Trash2 /></button>
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
                              fetchCategories();
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