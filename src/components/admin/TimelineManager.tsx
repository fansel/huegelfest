'use client';

import React, { useEffect, useState } from 'react';
import { TimelineData } from '@/lib/types';
import { loadTimeline, saveTimeline } from '@/lib/admin';
import { FaPen, FaTrash, FaPlus, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

interface TimelineEvent {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
}

export default function TimelineManager() {
  const [timeline, setTimeline] = useState<TimelineData>({ days: [] });
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [newEvent, setNewEvent] = useState<Omit<TimelineEvent, 'id' | 'day'>>({
    time: '',
    title: '',
    description: ''
  });
  const [editingEvent, setEditingEvent] = useState<{ dayIndex: number; eventIndex: number } | null>(null);

  useEffect(() => {
    loadTimeline().then(setTimeline);
  }, []);

  const handleAddEvent = () => {
    if (!newEvent.time || !newEvent.title || !newEvent.description) return;

    const updatedDays = [...timeline.days];
    const currentDayData = { ...updatedDays[currentDay] };
    currentDayData.events = [...currentDayData.events, newEvent as TimelineEvent];
    updatedDays[currentDay] = currentDayData;

    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setNewEvent({ time: '', title: '', description: '' });
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

  const handleEditEvent = (dayIndex: number, eventIndex: number) => {
    const event = timeline.days[dayIndex].events[eventIndex];
    setEditingEvent({ dayIndex, eventIndex });
    setNewEvent(event);
    setCurrentDay(dayIndex);
  };

  const handleSaveEdit = () => {
    if (!editingEvent || !newEvent.time || !newEvent.title || !newEvent.description) return;

    const updatedDays = [...timeline.days];
    const dayData = { ...updatedDays[editingEvent.dayIndex] };
    dayData.events = dayData.events.map((event, index) => 
      index === editingEvent.eventIndex ? newEvent as TimelineEvent : event
    );
    updatedDays[editingEvent.dayIndex] = dayData;

    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setEditingEvent(null);
    setNewEvent({ time: '', title: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
    setNewEvent({ time: '', title: '', description: '' });
  };

  return (
    <div className="space-y-6">
      {!editingEvent ? (
        <>
          <div className="flex flex-wrap gap-2">
            {timeline.days.map((day, index) => (
              <button
                key={index}
                onClick={() => setCurrentDay(index)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  currentDay === index
                    ? 'bg-[#ff9900] text-[#460b6c]'
                    : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20'
                }`}
              >
                {day.title}
              </button>
            ))}
          </div>

          {timeline.days.length > 0 && (
            <>
              <div className="space-y-4">
                {timeline.days[currentDay].events.map((event, index) => (
                  <div
                    key={index}
                    className="bg-[#460b6c] bg-opacity-50 rounded-lg p-4 border border-[#ff9900] border-opacity-30"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[#ff9900] font-bold">{event.time}</div>
                        <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                        <p className="text-[#ff9900] text-opacity-80">{event.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEvent(currentDay, index)}
                          className="text-[#ff9900] hover:text-[#ff9900] hover:opacity-80 flex items-center space-x-1"
                        >
                          <FaPen className="h-4 w-4" />
                          <span>Bearbeiten</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(index)}
                          className="text-red-500 hover:text-red-400 flex items-center space-x-1"
                        >
                          <FaTrash className="h-4 w-4" />
                          <span>Löschen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 bg-[#460b6c] bg-opacity-50 rounded-lg p-4 border border-[#ff9900] border-opacity-30">
                <h3 className="text-lg font-semibold text-white">Neues Event hinzufügen</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Uhrzeit (z.B. 14:00)"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Titel"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
                  />
                  <textarea
                    placeholder="Beschreibung"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
                  />
                  <button
                    onClick={handleAddEvent}
                    className="w-full py-2 px-4 bg-[#ff9900] text-[#460b6c] rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FaPlus className="h-4 w-4" />
                    <span>Event hinzufügen</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="space-y-4 bg-[#460b6c] bg-opacity-50 rounded-lg p-4 border border-[#ff9900] border-opacity-30">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Event bearbeiten</h3>
            <button
              onClick={handleCancelEdit}
              className="text-[#ff9900] hover:text-[#ff9900] hover:opacity-80 flex items-center space-x-1"
            >
              <FaArrowLeft className="h-4 w-4" />
              <span>Zurück</span>
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Uhrzeit (z.B. 14:00)"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
            />
            <input
              type="text"
              placeholder="Titel"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
            />
            <textarea
              placeholder="Beschreibung"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full p-2 rounded bg-[#460b6c] border border-[#ff9900] border-opacity-30 text-white"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2 px-4 bg-[#ff9900] text-[#460b6c] rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
              >
                <FaCheck className="h-4 w-4" />
                <span>Speichern</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="py-2 px-4 bg-[#460b6c] text-[#ff9900] border border-[#ff9900] rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
              >
                <FaTimes className="h-4 w-4" />
                <span>Abbrechen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 