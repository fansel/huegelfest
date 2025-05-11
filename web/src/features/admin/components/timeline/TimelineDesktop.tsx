import React, { useState } from 'react';
import type { TimelineData, Day, Event } from '@/features/timeline/types/types';
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
import { FaPlus, FaTrash, FaPencilAlt, FaCheck, FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Hilfsfunktion für ID-String
function getIdString(id: string | { $oid: string } | undefined): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && '$oid' in id) return id.$oid;
  return '';
}

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
function InlineInput({ value, onChange, onBlur, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (v: string) => void }) {
  const [editValue, setEditValue] = useState(value);
  return (
    <input
      className={clsx('border rounded px-2 py-1 text-sm', className)}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={() => onChange(editValue)}
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
  const [editDayId, setEditDayId] = useState<string | null>(null);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [newDay, setNewDay] = useState<{ title: string; description: string; date: string }>({ title: '', description: '', date: '' });
  const [newEvent, setNewEvent] = useState<{ [dayId: string]: { time: string; title: string; description: string; categoryId: string } }>({});
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'day' | 'event'; id: string; parentId?: string } | null>(null);

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
    timeline?.days.forEach(day => {
      if (day.events.some(e => getIdString(e._id) === eventId)) {
        fromDayId = getIdString(day._id);
      }
      if (over.data.current?.sortable?.containerId === getIdString(day._id)) {
        toDayId = getIdString(day._id);
      }
    });
    if (fromDayId && toDayId && fromDayId !== toDayId) {
      await moveEvent(fromDayId, toDayId, eventId);
      toast.success('Event verschoben');
    }
  };

  // --- Render ---
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Timeline-Editor (Desktop)</h2>
      {loading && <div className="text-blue-500">Lade Daten...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex flex-row gap-6 overflow-x-auto pb-4">
        {timeline?.days?.length ? (
          timeline.days.map(day => {
            const dayId = getIdString(day._id);
            return (
              <div key={dayId} className="bg-white rounded shadow p-4 min-w-[320px] flex flex-col gap-2 relative">
                {/* Tag-Header + Edit */}
                <div className="flex items-center gap-2 mb-2">
                  {editDayId === dayId ? (
                    <>
                      <InlineInput
                        value={day.title}
                        onChange={async v => { await updateDay(dayId, { ...day, title: v }); setEditDayId(null); toast.success('Tag aktualisiert'); }}
                        className="font-bold text-lg flex-1"
                      />
                      <button onClick={() => setEditDayId(null)} className="ml-1"><FaTimes className="w-5 h-5 text-gray-400" /></button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-lg flex-1">{day.title}</span>
                      <button onClick={() => setEditDayId(dayId)}><FaPencilAlt className="w-5 h-5 text-gray-400" /></button>
                    </>
                  )}
                  <button onClick={() => setConfirmDelete({ type: 'day', id: dayId })} className="ml-1"><FaTrash className="w-5 h-5 text-red-400" /></button>
                </div>
                {/* Event-Liste mit DnD */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={day.events.map(e => getIdString(e._id))} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {day.events.map(event => {
                        const eventId = getIdString(event._id);
                        return (
                          <SortableItem key={eventId} id={eventId}>
                            <div className="bg-gray-50 rounded p-2 flex items-center gap-2 group">
                              {editEventId === eventId ? (
                                <>
                                  <InlineInput
                                    value={event.title}
                                    onChange={async v => { await updateEvent(dayId, { ...event, title: v }); setEditEventId(null); toast.success('Event aktualisiert'); }}
                                    className="flex-1"
                                  />
                                  <button onClick={() => setEditEventId(null)}><FaTimes className="w-5 h-5 text-gray-400" /></button>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1">{event.title}</span>
                                  <button onClick={() => setEditEventId(eventId)}><FaCheck className="w-5 h-5 text-green-500" /></button>
                                </>
                              )}
                              <button onClick={() => setConfirmDelete({ type: 'event', id: eventId, parentId: dayId })}><FaTrash className="w-5 h-5 text-red-400" /></button>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
                {/* Event anlegen */}
                <form
                  className="flex gap-2 mt-2"
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const time = (form.elements.namedItem('time') as HTMLInputElement).value;
                    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                    const description = (form.elements.namedItem('description') as HTMLInputElement).value;
                    await createEvent(dayId, { time, title, description, categoryId: 'other' });
                    form.reset();
                    toast.success('Event angelegt');
                  }}
                >
                  <input name="time" type="time" className="input input-bordered input-xs" required />
                  <input name="title" placeholder="Event-Titel" className="input input-bordered input-xs" required />
                  <input name="description" placeholder="Beschreibung" className="input input-bordered input-xs" required />
                  <button type="submit" className="btn btn-xs btn-success"><FaPlus className="w-4 h-4" /></button>
                </form>
              </div>
            );
          })
        ) : (
          <div className="text-gray-400 italic p-8 w-full text-center">
            {loading ? 'Lade Timeline...' : 'Noch keine Tage vorhanden.'}
          </div>
        )}
        {/* Tag anlegen */}
        <form
          className="bg-white rounded shadow p-4 min-w-[320px] flex flex-col gap-2 justify-center items-center border-2 border-dashed border-gray-200 hover:border-blue-400 transition"
          onSubmit={async e => {
            e.preventDefault();
            await createDay({ ...newDay, date: new Date(newDay.date), events: [] });
            setNewDay({ title: '', description: '', date: '' });
            toast.success('Tag angelegt');
          }}
        >
          <div className="font-bold text-lg mb-2">Neuen Tag anlegen</div>
          <input
            className="input input-bordered input-sm w-full"
            placeholder="Titel"
            value={newDay.title}
            onChange={e => setNewDay(nd => ({ ...nd, title: e.target.value }))}
            required
          />
          <input
            className="input input-bordered input-sm w-full"
            placeholder="Beschreibung"
            value={newDay.description}
            onChange={e => setNewDay(nd => ({ ...nd, description: e.target.value }))}
            required
          />
          <input
            className="input input-bordered input-sm w-full"
            type="date"
            value={newDay.date}
            onChange={e => setNewDay(nd => ({ ...nd, date: e.target.value }))}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm mt-2 flex items-center gap-1"><FaPlus className="w-4 h-4" /> Tag anlegen</button>
        </form>
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
                  if (confirmDelete.type === 'day') {
                    await removeDay(confirmDelete.id);
                    toast.success('Tag gelöscht');
                  } else if (confirmDelete.type === 'event' && confirmDelete.parentId) {
                    await removeEvent(confirmDelete.parentId, confirmDelete.id);
                    toast.success('Event gelöscht');
                  }
                  setConfirmDelete(null);
                }}
              >Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineDesktop; 