import React, { useState } from 'react';
import { FaEdit, FaTrash, FaArrowRight, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { Event } from '@/types/types';
import { Category } from './types';

interface EventListProps {
  events: Event[];
  categories: Category[];
  onEditEvent: (eventIndex: number) => void;
  onDeleteEvent: (eventIndex: number) => void;
  onMoveEvent: (eventIndex: number) => void;
}

export default function EventList({
  events,
  onEditEvent,
  onDeleteEvent,
  onMoveEvent,
}: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {events.map((event, eventIndex) => (
          <div
            key={eventIndex}
            className="bg-gray-50 p-2 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{event.title}</span>
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    title="Details anzeigen"
                  >
                    <FaInfoCircle size={14} />
                  </button>
                </div>
                <p className="text-gray-600 text-xs">{event.time}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditEvent(eventIndex)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                  title="Bearbeiten"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={() => onDeleteEvent(eventIndex)}
                  className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                  title="Löschen"
                >
                  <FaTrash size={14} />
                </button>
                <button
                  onClick={() => onMoveEvent(eventIndex)}
                  className="p-1.5 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50 transition-colors"
                  title="Event verschieben"
                >
                  <FaArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-[#460b6c]">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Uhrzeit</p>
                <p className="text-gray-600">{selectedEvent.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Beschreibung</p>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
