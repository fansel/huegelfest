import React, { useEffect, useState } from 'react';
import { getTimelineAction } from '../../../../features/timeline/actions/getTimeline';
import { updateTimelineAction } from '../../../../features/timeline/actions/updateTimeline';
import { TimelineData, Day, Event } from '../../../../features/timeline/types/types';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash } from 'react-icons/fa';

const emptyEvent: Omit<Event, '_id'> = {
  time: '',
  title: '',
  description: '',
  categoryId: '',
};

const TimelineManagerDesktop: React.FC = () => {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDayDate, setNewDayDate] = useState('');
  const [addEventDayIdx, setAddEventDayIdx] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState(emptyEvent);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    const data = await getTimelineAction();
    setTimeline(data);
    setLoading(false);
  };

  const handleAddDay = async () => {
    if (!newDayTitle.trim() || !newDayDate) {
      toast.error('Titel und Datum angeben!');
      return;
    }
    const newDay: Day = {
      title: newDayTitle,
      description: '',
      date: new Date(newDayDate),
      events: [],
    };
    const updated = { ...timeline!, days: [...timeline!.days, newDay] };
    await updateTimelineAction(updated);
    toast.success('Tag hinzugefügt');
    setNewDayTitle('');
    setNewDayDate('');
    setShowAddDay(false);
    fetchTimeline();
  };

  const handleDeleteDay = async (idx: number) => {
    if (!timeline) return;
    const updated = { ...timeline, days: timeline.days.filter((_, i) => i !== idx) };
    await updateTimelineAction(updated);
    toast.success('Tag gelöscht');
    fetchTimeline();
  };

  const handleAddEvent = async (dayIdx: number) => {
    if (!newEvent.title.trim() || !newEvent.time) {
      toast.error('Titel und Zeit angeben!');
      return;
    }
    const updated = { ...timeline! };
    updated.days[dayIdx].events.push({ ...newEvent });
    await updateTimelineAction(updated);
    toast.success('Event hinzugefügt');
    setNewEvent(emptyEvent);
    setAddEventDayIdx(null);
    fetchTimeline();
  };

  const handleDeleteEvent = async (dayIdx: number, eventIdx: number) => {
    if (!timeline) return;
    const updated = { ...timeline };
    updated.days[dayIdx].events.splice(eventIdx, 1);
    await updateTimelineAction(updated);
    toast.success('Event gelöscht');
    fetchTimeline();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-[#460b6c]">Timeline verwalten</h2>
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setShowAddDay(true)}
          className="bg-[#ff9900] text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center gap-2"
        >
          <FaPlus /> Tag hinzufügen
        </button>
      </div>
      {timeline?.days.length === 0 && <div className="text-gray-400 text-center">Noch keine Tage vorhanden</div>}
      <div className="space-y-6">
        {timeline?.days.map((day, dayIdx) => (
          <div key={dayIdx} className="bg-gray-50 rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-bold text-lg text-[#460b6c]">{day.title}</div>
                <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => handleDeleteDay(dayIdx)}
                className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                aria-label="Tag löschen"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
            {/* Events */}
            <div className="mt-2 space-y-2">
              {day.events.length === 0 && <div className="text-gray-400 text-sm">Keine Events</div>}
              {day.events.map((event, eventIdx) => (
                <div key={eventIdx} className="flex justify-between items-center bg-white rounded p-2 shadow-sm">
                  <div>
                    <div className="font-medium text-[#460b6c]">{event.title}</div>
                    <div className="text-xs text-gray-500">{event.time} Uhr</div>
                    <div className="text-xs text-gray-400">{event.description}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(dayIdx, eventIdx)}
                    className="rounded-full bg-red-50 hover:bg-red-200 active:scale-95 transition-all shadow w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none border border-red-100"
                    aria-label="Event löschen"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {/* Event hinzufügen */}
            {addEventDayIdx === dayIdx ? (
              <div className="mt-4 flex flex-col gap-2 bg-white rounded-xl p-4 shadow">
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event-Titel"
                  className="border rounded p-2"
                />
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="border rounded p-2"
                />
                <input
                  type="text"
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Beschreibung (optional)"
                  className="border rounded p-2"
                />
                {/* Kategorie-Auswahl kann hier ergänzt werden */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAddEvent(dayIdx)}
                    className="bg-[#ff9900] text-white px-4 py-2 rounded hover:bg-orange-600"
                  >
                    Hinzufügen
                  </button>
                  <button
                    onClick={() => { setAddEventDayIdx(null); setNewEvent(emptyEvent); }}
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddEventDayIdx(dayIdx)}
                className="mt-4 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded shadow flex items-center gap-2"
              >
                <FaPlus /> Event hinzufügen
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Add Day Sheet */}
      {showAddDay && (
        <div className="fixed inset-0 z-50 bg-black/10 flex items-end justify-center">
          <div className="w-full max-w-lg mx-auto rounded-t-3xl shadow-[0_8px_40px_0_rgba(70,11,108,0.18)] border border-white/30 bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden animate-modern-sheet h-[40vh]">
            <div className="flex justify-center pt-4 pb-2 bg-transparent rounded-t-3xl">
              <div className="w-16 h-1.5 bg-gray-300/80 rounded-full shadow-sm" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-6">
              <input
                type="text"
                value={newDayTitle}
                onChange={e => setNewDayTitle(e.target.value)}
                placeholder="Titel des Tages"
                className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
              />
              <input
                type="date"
                value={newDayDate}
                onChange={e => setNewDayDate(e.target.value)}
                className="border-b-2 border-[#ff9900] focus:outline-none px-2 py-2 text-lg rounded w-full bg-gray-50"
              />
              <button
                onClick={handleAddDay}
                className="bg-[#ff9900] text-white px-6 py-2 rounded-full text-lg font-bold shadow hover:bg-orange-600 active:scale-95 transition"
              >
                Tag anlegen
              </button>
              <button
                onClick={() => setShowAddDay(false)}
                className="text-gray-400 text-sm mt-2"
              >
                Abbrechen
              </button>
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
      )}
    </div>
  );
};

export default TimelineManagerDesktop; 