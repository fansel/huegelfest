import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface TimelineManagerProps {
  events: TimelineEvent[];
  onSave: (events: TimelineEvent[]) => Promise<void>;
}

const TimelineManager = ({ events, onSave }: TimelineManagerProps) => {
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Bitte gib einen Titel ein.');
      return;
    }
    if (!newEvent.startTime || !newEvent.endTime) {
      toast.error('Bitte gib Start- und Endzeit ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      const event: TimelineEvent = {
        id: Date.now().toString(),
        ...newEvent,
      };
      const updatedEvents = [...events, event];
      await onSave(updatedEvents);
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Events:', error);
      toast.error('Das Event konnte nicht hinzugefügt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setIsSubmitting(true);
    try {
      const updatedEvents = events.filter((event) => event.id !== id);
      await onSave(updatedEvents);
    } catch (error) {
      console.error('Fehler beim Löschen des Events:', error);
      toast.error('Das Event konnte nicht gelöscht werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#460b6c]">Timeline verwalten</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            placeholder="Titel"
            className="p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
          />
          <input
            type="text"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            placeholder="Beschreibung"
            className="p-2 border border-gray-300 rounded text-sm bg-white text-gray-700 placeholder-gray-400"
          />
          <input
            type="time"
            value={newEvent.startTime}
            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
            className="p-2 border border-gray-300 rounded text-sm bg-white text-gray-700"
          />
          <input
            type="time"
            value={newEvent.endTime}
            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
            className="p-2 border border-gray-300 rounded text-sm bg-white text-gray-700"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddEvent}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff9900] rounded hover:bg-orange-600 disabled:opacity-50"
          >
            <FaPlus className="inline-block mr-1" />
            Event hinzufügen
          </button>
        </div>

        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700">{event.title}</h4>
                <p className="text-xs text-gray-500">{event.description}</p>
                <p className="text-xs text-gray-500">
                  {event.startTime} - {event.endTime}
                </p>
              </div>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 ml-2"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineManager; 