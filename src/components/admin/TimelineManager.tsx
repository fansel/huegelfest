'use client';

import React, { useEffect, useState } from 'react';
import { TimelineData, Event } from '@/lib/types';
import { loadTimeline, saveTimeline } from '@/lib/admin';
import { FaMusic, FaUsers, FaUtensils, FaCampground, FaGamepad, FaQuestion } from 'react-icons/fa';

const categoryOptions = [
  { value: 'music', label: 'Musik', icon: <FaMusic /> },
  { value: 'workshop', label: 'Workshop', icon: <FaUsers /> },
  { value: 'food', label: 'Essen & Trinken', icon: <FaUtensils /> },
  { value: 'camp', label: 'Camp', icon: <FaCampground /> },
  { value: 'game', label: 'Spiele', icon: <FaGamepad /> },
  { value: 'other', label: 'Sonstiges', icon: <FaQuestion /> }
] as const;

type Category = typeof categoryOptions[number]['value'];

export default function TimelineManager() {
  const [timeline, setTimeline] = useState<TimelineData>({ days: [] });
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    time: '',
    title: '',
    description: '',
    category: 'other'
  });
  const [editingEvent, setEditingEvent] = useState<{ dayIndex: number; eventIndex: number } | null>(null);

  useEffect(() => {
    loadTimeline().then(setTimeline);
  }, []);

  const handleAddEvent = () => {
    if (!newEvent.time || !newEvent.title || !newEvent.description) return;

    const updatedDays = [...timeline.days];
    const currentDayData = { ...updatedDays[currentDay] };
    currentDayData.events = [...currentDayData.events, newEvent];
    updatedDays[currentDay] = currentDayData;

    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setNewEvent({ time: '', title: '', description: '', category: 'other' });
  };

  const handleDeleteEvent = (eventIndex: number) => {
    const updatedDays = [...timeline.days];
    const currentDayData = { ...updatedDays[currentDay] };
    currentDayData.events = currentDayData.events.filter((_, index) => index !== eventIndex);
    updatedDays[currentDay] = currentDayData;

    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
  };

  const handleSaveEdit = () => {
    if (!editingEvent || !newEvent.time || !newEvent.title || !newEvent.description) return;

    const updatedDays = [...timeline.days];
    const dayData = { ...updatedDays[editingEvent.dayIndex] };
    dayData.events = dayData.events.map((event, index) => 
      index === editingEvent.eventIndex ? newEvent : event
    );
    updatedDays[editingEvent.dayIndex] = dayData;

    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setEditingEvent(null);
    setNewEvent({ time: '', title: '', description: '', category: 'other' });
  };

  const handleAddDay = () => {
    const updatedDays = [...timeline.days, { 
      title: `Tag ${timeline.days.length + 1}`, 
      description: `Beschreibung für Tag ${timeline.days.length + 1}`,
      events: [] 
    }];
    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setCurrentDay(updatedDays.length - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      handleSaveEdit();
    } else {
      handleAddEvent();
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h3 className="text-lg sm:text-xl font-bold text-[#460b6c] mb-4">Timeline verwalten</h3>

      <div className="space-y-6">
        {/* Day Navigation */}
        <div className="flex flex-wrap gap-2">
          {timeline.days.map((day, index) => (
            <button
              key={index}
              onClick={() => setCurrentDay(index)}
              className={`px-3 sm:px-4 py-2 rounded text-sm sm:text-base ${
                currentDay === index
                  ? 'bg-[#460b6c] text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Tag {index + 1}
            </button>
          ))}
          <button
            onClick={handleAddDay}
            className="px-3 sm:px-4 py-2 rounded bg-[#ff9900] text-white text-sm sm:text-base hover:bg-orange-600"
          >
            + Tag
          </button>
        </div>

        {/* Event List */}
        <div className="space-y-4">
          {timeline.days[currentDay]?.events.map((event, eventIndex) => (
            <div
              key={eventIndex}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {categoryOptions.find(cat => cat.value === event.category)?.icon}
                    <span className="font-medium text-sm sm:text-base">{event.title}</span>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">{event.time}</p>
                  <p className="text-gray-700 mt-2 text-sm sm:text-base">{event.description}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const event = timeline.days[currentDay].events[eventIndex];
                      setEditingEvent({ dayIndex: currentDay, eventIndex });
                      setNewEvent(event);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(eventIndex)}
                    className="p-2 text-red-600 hover:text-red-800 flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Event Form */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-md sm:text-lg font-semibold text-[#460b6c] mb-4">
            {editingEvent ? 'Event bearbeiten' : 'Neues Event hinzufügen'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Zeit</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kategorie</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as Category })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
                  required
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Titel</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#ff9900] focus:ring-[#ff9900] min-h-[100px] sm:min-h-[150px]"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-[#ff9900] text-white py-2 px-4 rounded-md hover:bg-orange-600 text-sm sm:text-base font-medium"
              >
                {editingEvent ? 'Aktualisieren' : 'Hinzufügen'}
              </button>
              {editingEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setNewEvent({ time: '', title: '', description: '', category: 'other' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm sm:text-base font-medium"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 