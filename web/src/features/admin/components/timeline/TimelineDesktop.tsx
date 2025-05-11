import React, { useState } from 'react';
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
import { FaPlus, FaTrash, FaPencilAlt, FaCheck, FaTimes, FaEdit, FaLock, FaSpinner } from 'react-icons/fa';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';

// Hilfsfunktion für ID-String
function getIdString(id: string | { $oid: string } | undefined): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id) return id.$oid;
  return '';
}

const getIconComponent = (iconName: string) => {
  const Icons = require('react-icons/fa');
  const IconComponent = Icons[iconName];
  return IconComponent || Icons.FaQuestion;
};

/**
 * Props für die Desktop-Variante des Timeline-Editors
 */
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

// --- Sortable Item Wrapper ---
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

// --- Inline Editing Input ---
function InlineInput({ value, onChange, onBlur, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (v: string) => Promise<void> | void }) {
  const [editValue, setEditValue] = useState(value);
  return (
    <input
      className={clsx('border rounded px-2 py-1 text-sm', className)}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={async () => { await onChange(editValue); }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      {...props}
    />
  );
}

/**
 * Desktop-Variante des Timeline-Editors für Admins
 */
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
    // Suche das Event und die Tage
    let fromDayId: string | undefined;
    let toDayId: string | undefined;
    let eventId = active.id as string;
    timelineData?.days.forEach(day => {
      if (day.events.some(e => getIdString(e._id) === eventId)) {
        fromDayId = getIdString(day._id);
      }
      if (over.data.current?.sortable?.containerId === getIdString(day._id)) {
        toDayId = getIdString(day._id);
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
      if (openDay) {
        const currentDay = timeline?.days.find(d => getIdString(d._id) === openDay);
        await timelineUpdateDay(openDay, { ...dayForm, date: dayForm.date, events: currentDay?.events ?? [] });
        toast.success('Tag aktualisiert');
      } else {
        await timelineCreateDay({ ...dayForm, date: dayForm.date, events: [] });
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

  // --- Render ---
  return (
    <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
      <h2 className="text-3xl font-bold mb-6 text-[#460b6c] text-center tracking-tight drop-shadow-sm">Timeline-Editor (Desktop)</h2>
      {(loading || categoriesLoading) ? (
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="animate-spin text-[#ff9900] text-3xl" />
        </div>
      ) : (
        <>
          <div className="flex justify-center gap-2 mb-4 mt-2">
            <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded-full font-bold transition ${activeTab === 'timeline' ? 'bg-white text-[#460b6c] shadow' : 'bg-[#460b6c] text-white'}`}>Timeline</button>
            <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-full font-bold transition ${activeTab === 'categories' ? 'bg-white text-[#460b6c] shadow' : 'bg-[#460b6c] text-white'}`}>Kategorien</button>
          </div>
          {activeTab === 'timeline' ? (
            <>
              {error && <div className="text-red-500">{error}</div>}
              {categoriesError && <div className="text-red-500">{categoriesError}</div>}
              <div className="flex flex-row gap-6 overflow-x-auto pb-4">
                {timelineData?.days?.length ? (
                  timelineData.days.map(day => {
                    const dayId = getIdString(day._id);
                    return (
                      <div
                        key={dayId}
                        className="bg-white shadow-lg rounded-2xl px-4 py-3 flex flex-col min-w-[340px] mb-4 transition-all duration-200 hover:scale-[1.01] border border-gray-200"
                      >
                        <button
                          className={'w-full flex items-center justify-between px-0 py-0 bg-transparent text-gray-900 font-semibold text-lg tracking-tight transition-all duration-200 rounded-2xl'}
                          onClick={() => setOpenDay(openDay === dayId ? null : dayId)}
                          aria-expanded={openDay === dayId}
                        >
                          <span className="flex-1 text-left truncate">{day.title}</span>
                          <span className="ml-2 text-xs text-gray-500">{openDay === dayId ? '▲' : '▼'}</span>
                        </button>
                        {openDay === dayId && (
                          <div className="p-4 flex flex-col gap-3 bg-white/90">
                            <div className="flex gap-2 items-center mb-2">
                              <button
                                onClick={() => { openDayForm(day); }}
                                className="rounded-full bg-blue-50 hover:bg-blue-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none border border-blue-100"
                                title="Tag bearbeiten"
                                aria-label="Tag bearbeiten"
                              >
                                <FaEdit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: 'day', id: dayId })}
                                className="rounded-full p-2 hover:bg-red-100 active:bg-red-200 transition"
                                title="Tag löschen"
                              >
                                <FaTrash className="w-5 h-5 text-red-500" />
                              </button>
                            </div>
                            {day.events.map(event => {
                              const eventId = getIdString(event._id);
                              const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                              const IconComponent = category ? getIconComponent(category.icon) : getIconComponent('FaQuestion');
                              return (
                                <div
                                  key={eventId}
                                  className="bg-white shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between gap-3 mb-2 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="mr-2 flex-shrink-0"><IconComponent className="text-lg" style={{ color: category?.color || '#ff9900' }} /></span>
                                    <div className="min-w-0">
                                      <div className="font-semibold text-gray-900 truncate text-base">{event.title}</div>
                                      <div className="text-xs text-gray-500 mt-0.5 truncate">{event.time}{event.description ? ' · ' + event.description : ''}</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <button
                                      onClick={() => {
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
                                      <FaEdit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ type: 'event', id: eventId, parentId: dayId })}
                                      className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                                      title="Löschen"
                                      aria-label="Löschen"
                                    >
                                      <FaTrash className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="mt-6 flex justify-center mb-6">
                              <button
                                onClick={() => {
                                  setEventToEdit(null);
                                  setEventDayId(dayId);
                                  setEventForm({ time: '', title: '', description: '', categoryId: '' });
                                  setShowEventModalOpen(true);
                                }}
                                className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                                aria-label="Neues Event anlegen"
                              >
                                <FaPlus className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 italic p-8 w-full text-center">
                    {timelineLoading ? 'Lade Timeline...' : 'Noch keine Tage vorhanden.'}
                  </div>
                )}
                <div className="mt-6 flex justify-center mb-6">
                  <button
                    onClick={() => openDayForm()}
                    className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                    aria-label="Neuen Tag anlegen"
                  >
                    <FaPlus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {confirmDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow-lg p-6 flex flex-col gap-4 min-w-[300px]">
                    <div className="font-bold text-lg">Wirklich löschen?</div>
                    <div className="text-gray-600">
                      {confirmDelete.type === 'day' ? 'Diesen Tag und alle zugehörigen Events löschen?' : 'Dieses Event löschen?'}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-sm" onClick={() => setConfirmDelete(null)}>Abbrechen</button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={async () => {
                          try {
                            if (confirmDelete.type === 'day') {
                              await timelineRemoveDay(confirmDelete.id);
                              toast.success('Tag gelöscht');
                              await timelineRefetch();
                            } else if (confirmDelete.type === 'event' && confirmDelete.parentId) {
                              await timelineRemoveEvent(confirmDelete.parentId, confirmDelete.id);
                              toast.success('Event gelöscht');
                              await timelineRefetch();
                            }
                            setConfirmDelete(null);
                          } catch (err: any) {
                            toast.error('Fehler beim Löschen: ' + (err?.message || err));
                          }
                        }}
                      >Löschen</button>
                    </div>
                  </div>
                </div>
              )}
              {showDayModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                  <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[70vh]">
                    <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
                      <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
                    </div>
                    <div className="flex items-center justify-between px-8 py-4 bg-transparent">
                      <span className="text-xl font-bold text-[#460b6c] tracking-tight">
                        {openDay ? 'Tag bearbeiten' : 'Tag anlegen'}
                      </span>
                      <button
                        onClick={() => { setShowDayModal(false); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
                        aria-label="Schließen"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 items-center justify-center">
                      <input
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        placeholder="Titel"
                        value={dayForm.title}
                        onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))}
                        required
                        autoFocus
                      />
                      <textarea
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        placeholder="Beschreibung (optional)"
                        value={dayForm.description}
                        onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                      <input
                        type="date"
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        value={dayForm.date ? dayForm.date.toISOString().slice(0, 10) : ''}
                        onChange={e => setDayForm(f => ({ ...f, date: e.target.value ? new Date(e.target.value) : null }))}
                        required
                      />
                      <div className="flex gap-2 justify-end mt-4 w-full">
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full flex-1 transition" onClick={() => { setShowDayModal(false); }}>Abbrechen</button>
                        <button className="bg-[#ff9900] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full flex-1 transition" onClick={handleSaveDay}>{openDay ? 'Speichern' : 'Anlegen'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                  <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[80vh]">
                    <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
                      <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
                    </div>
                    <div className="flex items-center justify-between px-8 py-4 bg-transparent">
                      <span className="text-xl font-bold text-[#460b6c] tracking-tight">
                        {eventToEdit ? 'Event bearbeiten' : 'Event anlegen'}
                      </span>
                      <button
                        onClick={() => {
                          setShowEventModalOpen(false);
                          setEventToEdit(null);
                          setEventDayId(null);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
                        aria-label="Schließen"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 items-center justify-center">
                      <input
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        placeholder="Titel"
                        value={eventForm.title}
                        onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                        required
                        autoFocus
                      />
                      <input
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        placeholder="Zeit (z.B. 14:00)"
                        type="time"
                        value={eventForm.time}
                        onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                        required
                      />
                      <textarea
                        className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                        placeholder="Beschreibung (optional)"
                        value={eventForm.description}
                        onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                      <select
                        className="input input-bordered input-xs w-full"
                        value={eventForm.categoryId}
                        onChange={e => setEventForm(f => ({ ...f, categoryId: e.target.value }))}
                        disabled={categoriesLoading}
                        required
                      >
                        <option value="" disabled>Kategorie wählen</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>
                            {cat.label || cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2 justify-end mt-4 w-full">
                        <button className="bg-[#ff9900] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full flex-1 transition" onClick={handleSaveEvent}>Speichern</button>
                        <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full flex-1 transition" onClick={() => {
                          setShowEventModalOpen(false);
                          setEventToEdit(null);
                          setEventDayId(null);
                        }}>Abbrechen</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="max-w-lg mx-auto w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-[#460b6c]">Kategorien</h3>
                </div>
                <ul className="space-y-3">
                  {categories.map(cat => (
                    <li key={cat._id} className="bg-white shadow rounded-xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border-2 border-white shadow p-2 bg-gray-50"><span className="text-xl" style={{ color: cat.color }}><>{getIconComponent(cat.icon)}</></span></span>
                        <span className="font-medium text-gray-800">{cat.name}</span>
                        {cat.isDefault && <span className="ml-2 text-gray-400" title="Standard-Kategorie"><FaLock /></span>}
                      </div>
                      {!cat.isDefault && (
                        <div className="flex gap-1">
                          <button onClick={() => { setEditCategoryId(cat._id); setCategoryForm({ name: cat.name, color: cat.color, icon: cat.icon }); setShowCategoryModal(true); }} className="rounded-full bg-blue-50 hover:bg-blue-200 w-8 h-8 flex items-center justify-center text-blue-600 border border-blue-100"><FaEdit /></button>
                          <button onClick={async () => { await removeEvent(cat._id); fetchCategories(); }} className="rounded-full bg-red-50 hover:bg-red-200 w-8 h-8 flex items-center justify-center text-red-600 border border-red-100"><FaTrash /></button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex justify-center mb-6">
                  <button
                    onClick={() => { setShowCategoryModal(true); setEditCategoryId(null); setCategoryForm({ name: '', color: '#ff9900', icon: '' }); }}
                    className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                    aria-label="Neue Kategorie anlegen"
                  >
                    <FaPlus className="h-5 w-5" />
                  </button>
                </div>
                {showCategoryModal && (
                  <div className="fixed left-0 right-0 top-0 bottom-[64px] z-50 flex items-end justify-center bg-black/40">
                    <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[80vh] relative">
                      <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
                        <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
                      </div>
                      <div className="flex items-center justify-between px-8 py-4 bg-transparent">
                        <span className="text-xl font-bold text-[#460b6c] tracking-tight">{editCategoryId ? 'Kategorie bearbeiten' : 'Kategorie anlegen'}</span>
                        <button onClick={() => setShowCategoryModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors" aria-label="Schließen">×</button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 items-center justify-center pb-24">
                        <input className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50" placeholder="Name" value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                        <input type="color" className="w-16 h-16 p-0 border-none bg-transparent" value={categoryForm.color} onChange={e => setCategoryForm(f => ({ ...f, color: e.target.value }))} />
                        <div className="w-full">
                          <input type="text" placeholder="Icon suchen..." className="border-b border-gray-200 px-2 py-1 mb-2 w-full" value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
                          <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                            {Object.keys(require('react-icons/fa')).filter(name => name.startsWith('Fa') && name.toLowerCase().includes(iconSearch.toLowerCase())).map(name => {
                              const Icon = require('react-icons/fa')[name];
                              return <button key={name} className={`rounded p-1 border ${categoryForm.icon === name ? 'border-[#ff9900] bg-[#ff9900]/10' : 'border-transparent'}`} onClick={() => setCategoryForm(f => ({ ...f, icon: name }))}><Icon className="text-2xl" /></button>;
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full bg-white/95 px-8 pb-6 pt-2 z-10">
                        <button onClick={async () => {
                          if (!categoryForm.name || !categoryForm.icon) return;
                          if (editCategoryId) {
                            // updateCategoryAction analog wie mobil
                          } else {
                            // createCategoryAction analog wie mobil
                          }
                          setShowCategoryModal(false);
                          fetchCategories();
                        }} className="bg-[#ff9900] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full w-full transition">{editCategoryId ? 'Speichern' : 'Anlegen'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TimelineDesktop;