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
import { FaPlus, FaTrash, FaPen, FaCheck, FaTimes, FaEdit, FaLock, FaSpinner } from 'react-icons/fa';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';
import Datepicker from 'react-tailwindcss-datepicker';
import * as Icons from 'react-icons/fa';
import { createCategoryAction } from '@/features/categories/actions/createCategory';
import { updateCategoryAction } from '@/features/categories/actions/updateCategory';
import { deleteCategoryAction } from '@/features/categories/actions/deleteCategory';

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
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || Icons.FaQuestion;
};

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

  return (
    <>
      <div className="w-full px-2 sm:px-0 relative min-h-[60vh] pb-24">
        <h2 className="text-2xl font-bold mb-4 text-[#460b6c] text-center tracking-tight drop-shadow-sm">Timeline-Editor (Mobil)</h2>
        {/* Timeline-Tab: Ladezustand */}
        {(loading || categoriesLoading) ? (
          <div className="flex justify-center items-center h-40">
            <FaSpinner className="animate-spin text-[#ff9900] text-3xl" />
          </div>
        ) : (
          <>
            {/* Tab-Bar nur hier! */}
            <div className="flex justify-center gap-2 mb-4 mt-2">
              <button onClick={() => setActiveTab('timeline')} className={`px-4 py-2 rounded-full font-bold transition ${activeTab === 'timeline' ? 'bg-white text-[#460b6c] shadow' : 'bg-[#460b6c] text-white'}`}>Timeline</button>
              <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-full font-bold transition ${activeTab === 'categories' ? 'bg-white text-[#460b6c] shadow' : 'bg-[#460b6c] text-white'}`}>Kategorien</button>
            </div>
            {activeTab === 'timeline' ? (
              <>
                {error && <div className="text-red-500">{error}</div>}
                {categoriesError && <div className="text-red-500">{categoriesError}</div>}
                {/* Timeline-Ansicht */}
                {activeTab === 'timeline' && (
                  <>
                    <div className="flex flex-col gap-4">
                      {timeline?.days?.length ? (
                        timeline.days.map(day => {
                          const dayId = getIdString(day._id);
                          const isOpen = openDay === dayId;
                          return (
                            <div
                              key={dayId}
                              className="bg-white shadow-lg rounded-2xl px-4 py-3 flex flex-col w-full mb-4 transition-all duration-200 hover:scale-[1.01] border border-gray-200"
                            >
                              <button
                                className={
                                  'w-full flex items-center justify-between px-0 py-0 bg-transparent text-gray-900 font-semibold text-lg tracking-tight transition-all duration-200' +
                                  (isOpen ? ' rounded-t-2xl' : ' rounded-2xl')
                                }
                                onClick={() => setOpenDay(isOpen ? null : dayId)}
                                aria-expanded={isOpen}
                              >
                                <span className="flex-1 text-left truncate">{day.title}</span>
                                <span className="ml-2 text-xs text-gray-500">{isOpen ? '▲' : '▼'}</span>
                              </button>
                              {isOpen && (
                                <div className="p-4 flex flex-col gap-3 bg-white/90">
                                  {/* Tag bearbeiten/löschen */}
                                  <div className="flex gap-2 items-center mb-2">
                                    <button
                                      onClick={() => { setEditDayId(dayId); openDayForm(day); }}
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
                                  {/* Events als Cards mit DnD */}
                                  {day.events.map(event => {
                                    const eventId = getIdString(event._id);
                                    const category = categories.find(cat => getIdString(cat._id) === (typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || ''));
                                    const IconComponent = category ? getIconComponent(category.icon) : Icons.FaQuestion;
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
                                            <FaEdit className="h-4 w-4" />
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
                                            <FaTrash className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {/* Event anlegen */}
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
                          {loading ? 'Lade Timeline...' : 'Noch keine Tage vorhanden.'}
                        </div>
                      )}
                    </div>
                    {/* Tag anlegen Floating-Button */}
                    <div className="mt-6 flex justify-center mb-6">
                      <button
                        onClick={() => openDayForm()}
                        className="rounded-full bg-gradient-to-br from-[#ff9900] to-[#ffb84d] text-white shadow-3xl w-10 h-10 flex items-center justify-center text-xl focus:outline-none focus:ring-2 focus:ring-[#ff9900]/30 active:scale-95 transition border-2 border-white"
                        aria-label="Neuen Tag anlegen"
                      >
                        <FaPlus className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Bestätigungsdialog für Löschen */}
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
                                    await removeDay(confirmDelete.id);
                                    toast.success('Tag gelöscht');
                                    await refetch();
                                  } else if (confirmDelete.type === 'event' && confirmDelete.parentId) {
                                    const dayId = getIdString(confirmDelete.parentId);
                                    const eventId = getIdString(confirmDelete.id);
                                    console.log('[TimelineMobile] removeEvent:', { dayId, eventId });
                                    await removeEvent(dayId, eventId);
                                    toast.success('Event gelöscht');
                                    await refetch();
                                  }
                                  setConfirmDelete(null);
                                } catch (err: any) {
                                  console.error('[TimelineMobile] Fehler beim Löschen:', err);
                                  toast.error('Fehler beim Löschen: ' + (err?.message || err));
                                }
                              }}
                            >Löschen</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Modal für Tag anlegen/bearbeiten */}
                    {showDayModal && (
                      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                        <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[70vh]">
                          {/* Drag Handle */}
                          <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
                            <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
                          </div>
                          {/* Header */}
                          <div className="flex items-center justify-between px-8 py-4 bg-transparent">
                            <span className="text-xl font-bold text-[#460b6c] tracking-tight">
                              {editDayId ? 'Tag bearbeiten' : 'Tag anlegen'}
                            </span>
                            <button
                              onClick={() => { setShowDayModal(false); setEditDayId(null); }}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/70 hover:bg-white/90 text-gray-500 hover:text-[#460b6c] text-2xl font-bold focus:outline-none shadow transition-colors"
                              aria-label="Schließen"
                            >
                              ×
                            </button>
                          </div>
                          {/* Content */}
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
                            <Datepicker
                              value={dayForm.date ? { startDate: dayForm.date, endDate: dayForm.date } : { startDate: null, endDate: null }}
                              onChange={(val: any) => setDayForm(f => ({ ...f, date: val?.startDate ? new Date(val.startDate) : null }))}
                              asSingle={true}
                              useRange={false}
                              displayFormat="YYYY-MM-DD"
                              inputClassName="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
                              placeholder="Datum wählen"
                              required
                            />
                            <div className="flex gap-2 justify-end mt-4 w-full">
                              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full flex-1 transition" onClick={() => { setShowDayModal(false); setEditDayId(null); }}>Abbrechen</button>
                              <button className="bg-[#ff9900] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full flex-1 transition" onClick={handleSaveDay}>{editDayId ? 'Speichern' : 'Anlegen'}</button>
                            </div>
                          </div>
                          <style jsx global>{`
                            @keyframes modern-sheet {
                              0% { transform: translateY(100%) scale(0.98); opacity: 0.7; }
                              80% { transform: translateY(-8px) scale(1.02); opacity: 1; }
                              100% { transform: translateY(0) scale(1); opacity: 1; }
                            }
                            .animate-modern-sheet {
                              animation: modern-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
                            }
                          `}</style>
                        </div>
                      </div>
                    )}
                    {/* Modal für Event anlegen/bearbeiten */}
                    {showEventModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
                        <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[80vh]">
                          {/* Drag Handle */}
                          <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
                            <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
                          </div>
                          {/* Header */}
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
                          {/* Content */}
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
                            <CategorySelect
                              categories={categories}
                              value={eventForm.categoryId}
                              onChange={v => setEventForm(f => ({ ...f, categoryId: v }))}
                              disabled={categoriesLoading}
                            />
                            <div className="flex gap-2 justify-end mt-4 w-full">
                              <button className="bg-[#ff9900] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full flex-1 transition" onClick={handleSaveEvent}>Speichern</button>
                              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full flex-1 transition" onClick={() => {
                                setShowEventModalOpen(false);
                                setEventToEdit(null);
                                setEventDayId(null);
                              }}>Abbrechen</button>
                            </div>
                          </div>
                          <style jsx global>{`
                            @keyframes modern-sheet {
                              0% { transform: translateY(100%) scale(0.98); opacity: 0.7; }
                              80% { transform: translateY(-8px) scale(1.02); opacity: 1; }
                              100% { transform: translateY(0) scale(1); opacity: 1; }
                            }
                            .animate-modern-sheet {
                              animation: modern-sheet 0.32s cubic-bezier(0.22, 1, 0.36, 1);
                            }
                          `}</style>
                        </div>
                      </div>
                    )}
                  </>
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
                            <button onClick={async () => { await deleteCategoryAction(cat._id); fetchCategories(); }} className="rounded-full bg-red-50 hover:bg-red-200 w-8 h-8 flex items-center justify-center text-red-600 border border-red-100"><FaTrash /></button>
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
                      <FaPlus className="h-5 w-5" />
                    </button>
                  </div>
                  {/* Modal für Kategorie anlegen/bearbeiten */}
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
                          {/* Icon-Auswahl */}
                          <div className="w-full">
                            <input type="text" placeholder="Icon suchen..." className="border-b border-gray-200 px-2 py-1 mb-2 w-full" value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
                            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                              {Object.keys(Icons).filter(name => name.startsWith('Fa') && name.toLowerCase().includes(iconSearch.toLowerCase())).map(name => {
                                const Icon = (Icons as any)[name];
                                return <button key={name} className={`rounded p-1 border ${categoryForm.icon === name ? 'border-[#ff9900] bg-[#ff9900]/10' : 'border-transparent'}`} onClick={() => setCategoryForm(f => ({ ...f, icon: name }))}><Icon className="text-2xl" /></button>;
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full bg-white/95 px-8 pb-6 pt-2 z-10">
                          <button onClick={async () => {
                            if (!categoryForm.name || !categoryForm.icon) return;
                            if (editCategoryId) {
                              await updateCategoryAction(editCategoryId, { name: categoryForm.name, color: categoryForm.color, icon: categoryForm.icon });
                            } else {
                              await createCategoryAction({ name: categoryForm.name, color: categoryForm.color, icon: categoryForm.icon });
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
    </>
  );
};

export default TimelineMobile; 