import React, { useState, useRef, useEffect } from 'react';
import type { TimelineData, Day, Event, Category } from '@/features/timeline/types/types';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Pencil, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import * as LucideIcons from 'lucide-react';
import { createCategoryAction } from '@/features/categories/actions/createCategory';
import { updateCategoryAction } from '@/features/categories/actions/updateCategory';
import { deleteCategoryAction } from '@/features/categories/actions/deleteCategory';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/shared/components/ui/sheet';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/shared/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/shared/components/ui/dialog';

// Hilfsfunktion für ID-String
function getIdString(id: string | { $oid: string } | undefined): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id) return id.$oid;
  return '';
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.HelpCircle;
};

export interface TimelineDesktopProps {
  timeline: TimelineData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDay: (day: Day) => Promise<void>;
  removeDay: (dayId: string) => Promise<void>;
  updateDay: (dayId: string, day: Day) => Promise<void>;
  createEvent: (dayId: string, event: Event) => Promise<void>;
  removeEvent: (dayId: string, eventId: string) => Promise<void>;
  moveEvent: (fromDayId: string, toDayId: string, eventId: string) => Promise<void>;
  updateEvent: (dayId: string, event: Event) => Promise<void>;
}

function toPascalCase(kebab: string) {
  return kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const ICONS_PER_PAGE = 24;

const TimelineDesktop: React.FC<TimelineDesktopProps> = ({
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
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories'>('timeline');
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);
  const [dayForm, setDayForm] = useState<{ title: string; description: string; date: Date | null }>({ title: '', description: '', date: null });
  const [showEventModalOpen, setShowEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [eventDayId, setEventDayId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<{ time: string; title: string; description: string; categoryId: string }>({ time: '', title: '', description: '', categoryId: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{ name: string; color: string; icon: string }>({ name: '', color: '#ff9900', icon: '' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState('');
  const [iconPage, setIconPage] = useState(0);

  const {
    timeline: timelineData,
    loading: timelineLoading,
    error: timelineError,
    refetch: timelineRefetch,
    createDay: timelineCreateDay,
    removeDay: timelineRemoveDay,
    updateDay: timelineUpdateDay,
    createEvent: timelineCreateEvent,
    removeEvent: timelineRemoveEvent,
    moveEvent: timelineMoveEvent,
    updateEvent: timelineUpdateEvent,
    categories,
    categoriesLoading,
    categoriesError,
    fetchCategories,
  } = useTimeline();

  // DnD Sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // --- Drag End Handler ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    let fromDayId: string | undefined;
    let toDayId: string | undefined;
    const eventId = active.id as string;
    timelineData?.days.forEach(day => {
      const dayId = getIdString(day._id);
      if (day.events.some(e => getIdString(e._id) === eventId)) {
        fromDayId = dayId;
      }
      if (over.data.current?.sortable?.containerId === dayId) {
        toDayId = dayId;
      }
    });
    if (fromDayId && toDayId && fromDayId !== toDayId) {
      await timelineMoveEvent(fromDayId, toDayId, eventId);
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
      setEditDayId(getIdString(day._id));
    } else {
      setDayForm({ title: '', description: '', date: null });
      setEditDayId(null);
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
        await timelineUpdateDay(editDayId, { ...timelineData!.days.find(d => getIdString(d._id) === editDayId)!, ...dayForm, date: dayForm.date });
        toast.success('Tag aktualisiert');
        setEditDayId(null);
      } else {
        await timelineCreateDay({ title: dayForm.title, description: dayForm.description, date: dayForm.date, events: [] });
        toast.success('Tag angelegt');
      }
      setShowDayModal(false);
      setDayForm({ title: '', description: '', date: null });
      await timelineRefetch();
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
        await timelineUpdateEvent(dayId, { ...eventToEdit, ...eventForm });
        toast.success('Event aktualisiert');
        await timelineRefetch();
      } else if (eventDayId) {
        const dayId = getIdString(eventDayId);
        await timelineCreateEvent(dayId, { ...eventForm });
        toast.success('Event angelegt');
        await timelineRefetch();
      }
      setShowEventModalOpen(false);
      setEventToEdit(null);
      setEventDayId(null);
      setEventForm({ time: '', title: '', description: '', categoryId: '' });
    } catch (err: any) {
      toast.error('Fehler beim Speichern des Events: ' + (err?.message || err));
    }
  };

  // Kategorie speichern
  const handleSaveCategory = async () => {
    if (!categoryForm.name || !categoryForm.icon) return;
    if (editCategoryId) {
      await updateCategoryAction(editCategoryId, { name: categoryForm.name, color: categoryForm.color, icon: categoryForm.icon });
    } else {
      await createCategoryAction({ name: categoryForm.name, color: categoryForm.color, icon: categoryForm.icon });
    }
    setShowCategoryModal(false);
    fetchCategories();
  };

  // --- Render ---
  return (
    <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
      <h2 className="text-3xl font-bold mb-6 text-[#460b6c] text-center tracking-tight drop-shadow-sm">Timeline-Editor (Desktop)</h2>
      {(loading || categoriesLoading) ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="animate-spin text-[#ff9900] text-3xl" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'timeline' | 'categories')} className="mb-4 mt-2">
          <TabsList className="flex justify-center gap-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            {error && <div className="text-red-500">{error}</div>}
            {categoriesError && <div className="text-red-500">{categoriesError}</div>}
            <div className="flex flex-row gap-6 overflow-x-auto pb-4">
              {timelineData?.days?.length ? (
                timelineData.days.map(day => {
                  const dayId = getIdString(day._id);
                  const isOpen = openDay === dayId;
                  return (
                    <Card key={dayId} className="min-w-[340px] max-w-[400px] flex-1 shadow-lg border border-gray-200 bg-white/95 hover:shadow-2xl transition-all">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 cursor-pointer" onClick={() => setOpenDay(isOpen ? null : dayId)}>
                        <CardTitle className="truncate text-lg font-bold text-[#460b6c]">{day.title}</CardTitle>
                        <span className="text-xs text-gray-500 font-medium ml-auto whitespace-nowrap">{day.date ? format(new Date(day.date), 'EEE, dd.MM.yyyy', { locale: de }) : ''}</span>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {isOpen && (
                          <>
                            <div className="flex gap-2 items-center mb-2">
                              <Button variant="secondary" size="icon" onClick={() => { openDayForm(day); }} title="Tag bearbeiten"><Pencil /></Button>
                              <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'day', id: dayId })} title="Tag löschen"><Trash2 /></Button>
                            </div>
                            {day.events.map(event => {
                              const eventId = getIdString(event._id);
                              const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                              const IconComponent = category ? getIconComponent(category.icon) : LucideIcons.HelpCircle;
                              return (
                                <Card key={eventId} className="flex items-center gap-3 px-4 py-3 rounded-xl shadow border-0 bg-white/95 hover:shadow-lg transition-all">
                                  <span className="flex-shrink-0">{IconComponent && <IconComponent className="text-xl" style={{ color: category?.color || '#ff9900' }} />}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate text-base">{event.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-2">
                                      <Badge style={{ background: category?.color || '#ff9900', color: '#fff' }} className="px-2 py-0.5 text-xs font-medium rounded">{category?.name || 'Kategorie'}</Badge>
                                      <span>{event.time}</span>
                                      {event.description && <span className="text-gray-400">· {event.description}</span>}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 items-center ml-2">
                                    <Button variant="secondary" size="icon" onClick={() => {
                                      setEventToEdit(event);
                                      setEventDayId(dayId);
                                      setEventForm({
                                        time: event.time,
                                        title: event.title,
                                        description: event.description,
                                        categoryId: typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || '',
                                      });
                                      setShowEventModalOpen(true);
                                    }} title="Bearbeiten"><Pencil /></Button>
                                    <Button variant="destructive" size="icon" onClick={() => setConfirmDelete({ type: 'event', id: eventId, parentId: dayId })} title="Löschen"><Trash2 /></Button>
                                  </div>
                                </Card>
                              );
                            })}
                            <div className="mt-4 flex flex-col items-center">
                              <Button variant="default" size="icon" className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white" onClick={() => {
                                setEventToEdit(null);
                                setEventDayId(dayId);
                                setEventForm({ time: '', title: '', description: '', categoryId: categories[0] ? getIdString(categories[0]._id) : '' });
                                setShowEventModalOpen(true);
                              }} aria-label="Neues Event anlegen"><Plus /></Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-gray-400 italic p-8 w-full text-center">
                  {timelineLoading ? 'Lade Timeline...' : 'Noch keine Tage vorhanden.'}
                </div>
              )}
              <div className="mt-6 flex justify-center mb-6">
                <Button variant="default" size="icon" className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white" onClick={() => openDayForm()} aria-label="Neuen Tag anlegen"><Plus /></Button>
              </div>
            </div>
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
                      try {
                        if (confirmDelete?.type === 'day') {
                          await timelineRemoveDay(confirmDelete.id);
                          toast.success('Tag gelöscht');
                          await timelineRefetch();
                        } else if (confirmDelete?.type === 'event' && confirmDelete.parentId) {
                          await timelineRemoveEvent(confirmDelete.parentId, confirmDelete.id);
                          toast.success('Event gelöscht');
                          await timelineRefetch();
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
            {/* Modal für Tag anlegen/bearbeiten */}
            <Dialog open={showDayModal} onOpenChange={(open) => { setShowDayModal(open); if (!open) setEditDayId(null); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editDayId ? 'Tag bearbeiten' : 'Tag anlegen'}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 items-center justify-center py-4">
                  <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2">
                    <label htmlFor="day-title" className="text-sm font-medium text-gray-700">Titel</label>
                    <Input
                      id="day-title"
                      placeholder="Titel"
                      value={dayForm.title}
                      onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                      required
                      className="w-full"
                      autoFocus
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="day-date">
                          {dayForm.date ? format(dayForm.date, 'dd.MM.yyyy', { locale: de }) : 'Datum wählen'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dayForm.date ?? undefined}
                          onSelect={date => setDayForm(f => ({ ...f, date: date ?? null }))}
                          locale={de}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <DialogFooter className="w-full flex-row justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="secondary" onClick={() => { setShowDayModal(false); setEditDayId(null); }}>Abbrechen</Button>
                    </DialogClose>
                    <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSaveDay}>{editDayId ? 'Speichern' : 'Anlegen'}</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
            {/* Modal für Event anlegen/bearbeiten */}
            <Dialog open={showEventModalOpen} onOpenChange={(open) => { setShowEventModalOpen(open); if (!open) { setEventToEdit(null); setEventDayId(null); } }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{eventToEdit ? 'Event bearbeiten' : 'Event anlegen'}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 items-center justify-center py-4">
                  <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2">
                    <label htmlFor="event-title" className="text-sm font-medium text-gray-700">Titel</label>
                    <Input
                      id="event-title"
                      placeholder="Titel"
                      value={eventForm.title}
                      onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                      required
                      className="w-full"
                      autoFocus
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
                            {categories.find(cat => getIdString(cat._id) === eventForm.categoryId)?.name || 'Kategorie wählen'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat._id} value={getIdString(cat._id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-xs text-red-500 mt-2">Bitte zuerst eine Kategorie anlegen.</div>
                    )}
                  </div>
                  <DialogFooter className="w-full flex-row justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="secondary" onClick={() => { setShowEventModalOpen(false); setEventToEdit(null); setEventDayId(null); }}>Abbrechen</Button>
                    </DialogClose>
                    <Button className="bg-[#ff9900] hover:bg-orange-600" onClick={handleSaveEvent}>Speichern</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
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
                        <Button variant="secondary" size="icon" onClick={() => { setEditCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon }); setShowCategoryModal(true); }}><Pencil /></Button>
                        <Button variant="destructive" size="icon" onClick={async () => { await deleteCategoryAction(cat._id); fetchCategories(); }}><Trash2 /></Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-center mb-6">
                <Button variant="default" size="icon" className="bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl border-2 border-white" onClick={() => { setShowCategoryModal(true); setEditCategoryId(null); setCategoryForm({ name: '', color: '#ff9900', icon: '' }); }} aria-label="Neue Kategorie anlegen"><Plus /></Button>
              </div>
              {/* Modal für Kategorie anlegen/bearbeiten */}
              <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editCategoryId ? 'Kategorie bearbeiten' : 'Kategorie anlegen'}</DialogTitle>
                  </DialogHeader>
                  <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2 py-4">
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
                    <label htmlFor="category-color" className="text-sm font-medium text-gray-700">Farbe</label>
                    <Input
                      id="category-color"
                      type="color"
                      value={categoryForm.color}
                      onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))}
                      className="w-16 h-16 p-0 border-none bg-transparent"
                    />
                    <label htmlFor="category-icon" className="text-sm font-medium text-gray-700">Icon</label>
                    <Input type="text" placeholder="Icon suchen..." className="border-b border-gray-200 px-2 py-1 mb-2 w-full" value={iconSearch} onChange={e => { setIconSearch(e.target.value); setIconPage(0); }} id="category-icon" />
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                      {Object.keys(LucideIcons).filter(name => name.toLowerCase().includes(iconSearch.toLowerCase())).slice(iconPage * ICONS_PER_PAGE, (iconPage + 1) * ICONS_PER_PAGE).map(name => {
                        const Icon = (LucideIcons as any)[name];
                        return (
                          <button key={name} className={`rounded p-1 border ${categoryForm.icon === name ? 'border-[#ff9900] bg-[#ff9900]/10' : 'border-transparent'}`} onClick={() => setCategoryForm(f => ({ ...f, icon: name }))}><Icon className="text-2xl" /></button>
                        );
                      })}
                    </div>
                    <DialogFooter className="w-full flex-row justify-end gap-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>Abbrechen</Button>
                      </DialogClose>
                      <Button className="bg-[#ff9900] hover:bg-orange-600 w-full" onClick={handleSaveCategory}>{editCategoryId ? 'Speichern' : 'Anlegen'}</Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TimelineDesktop;