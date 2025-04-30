import React from 'react';
import { FaEdit, FaTrash, FaArrowRight } from 'react-icons/fa';
import { Event } from '@/lib/types';
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
  categories,
  onEditEvent,
  onDeleteEvent,
  onMoveEvent
}: EventListProps) {
  return (
    <div className="space-y-4">
      {events.map((event, eventIndex) => (
        <div
          key={eventIndex}
          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm sm:text-base">{event.title}</span>
              </div>
              <p className="text-gray-600 text-sm sm:text-base">{event.time}</p>
              <p className="text-gray-700 mt-2 text-sm sm:text-base">{event.description}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => onEditEvent(eventIndex)}
                className="p-2 text-blue-600 hover:text-blue-800 flex-1 sm:flex-none text-sm sm:text-base"
                data-testid={`edit-event-${eventIndex}`}
              >
                Bearbeiten
              </button>
              <button
                onClick={() => onDeleteEvent(eventIndex)}
                className="p-2 text-red-600 hover:text-red-800 flex-1 sm:flex-none text-sm sm:text-base"
                data-testid={`delete-event-${eventIndex}`}
              >
                Löschen
              </button>
              <button
                onClick={() => onMoveEvent(eventIndex)}
                className="p-2 text-green-600 hover:text-green-800 flex-1 sm:flex-none text-sm sm:text-base"
                title="Event verschieben"
              >
                <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 