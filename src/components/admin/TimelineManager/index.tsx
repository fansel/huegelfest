'use client';

import React, { useEffect, useState } from 'react';
import { TimelineData, Event, Day } from '@/lib/types';
import { loadTimeline, saveTimeline } from '@/lib/admin';
import { FaPlus } from 'react-icons/fa';
import CategoryList from './CategoryList';
import DayNavigation from './DayNavigation';
import EventList from './EventList';
import EventForm from './EventForm';
import CategoryModal from './CategoryModal';
import DeleteCategoryDialog from './DeleteCategoryDialog';
import DeleteDayDialog from './DeleteDayDialog';
import { Category } from './types';
import MoveEventDialog from './MoveEventDialog';

export default function TimelineManager() {
  const [timeline, setTimeline] = useState<TimelineData>({ days: [] });
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [newEvent, setNewEvent] = useState<Omit<Event, 'id'>>({
    time: '',
    title: '',
    description: '',
    categoryId: 'other'
  });
  const [editingEvent, setEditingEvent] = useState<{ dayIndex: number; eventIndex: number } | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [movingEvent, setMovingEvent] = useState<{ dayIndex: number; eventIndex: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{ value: string; eventCount: number } | null>(null);
  const [showDeleteDayDialog, setShowDeleteDayDialog] = useState(false);
  const [deletingDay, setDeletingDay] = useState<{ index: number; title: string; eventCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  useEffect(() => {
    loadTimeline().then(setTimeline);
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kategorien:', error);
    }
  };

  const handleDeleteCategoryClick = (value: string) => {
    const categoryToDelete = categories.find(cat => cat.value === value);
    if (!categoryToDelete) return;

    const eventsWithCategory = timeline.days.reduce((count, day) => {
      return count + day.events.filter(event => event.categoryId === categoryToDelete._id).length;
    }, 0);

    setDeletingCategory({ value, eventCount: eventsWithCategory });
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setIsLoading(true);
      // Finde die Kategorie anhand des value
      const categoryToDelete = categories.find(cat => cat.value === deletingCategory.value);
      if (!categoryToDelete) {
        alert('Kategorie nicht gefunden');
        return;
      }

      console.log('Lösche Kategorie mit ID:', categoryToDelete._id);
      const response = await fetch(`/api/categories?id=${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Löschen der Kategorie');
      }

      // Finde die "Sonstiges"-Kategorie
      const otherCategory = categories.find(cat => cat.value === 'other');
      if (!otherCategory) {
        throw new Error('Sonstiges-Kategorie nicht gefunden');
      }

      // Aktualisiere die Timeline, indem alle Events der gelöschten Kategorie der "Sonstiges"-Kategorie zugeordnet werden
      const updatedTimeline = {
        ...timeline,
        days: timeline.days.map(day => ({
          ...day,
          events: day.events.map(event => ({
            ...event,
            categoryId: event.categoryId === categoryToDelete._id ? otherCategory._id : event.categoryId
          }))
        }))
      };

      // Speichere die aktualisierte Timeline
      await saveTimeline(updatedTimeline);
      setTimeline(updatedTimeline);

      // Aktualisiere die Kategorien
      const updatedCategories = categories.filter(cat => cat._id !== categoryToDelete._id);
      setCategories(updatedCategories);

      setShowDeleteDialog(false);
      setDeletingCategory(null);
    } catch (error) {
      console.error('Fehler beim Löschen der Kategorie:', error);
      alert('Fehler beim Löschen der Kategorie');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDay = () => {
    const today = new Date();
    const updatedDays = [...timeline.days, { 
      title: `Tag ${timeline.days.length + 1}`, 
      description: `Beschreibung für Tag ${timeline.days.length + 1}`,
      date: today,
      events: [] 
    }];
    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    setCurrentDay(updatedDays.length - 1);
  };

  const handleDeleteDay = (dayIndex: number) => {
    const day = timeline.days[dayIndex];
    setDeletingDay({
      index: dayIndex,
      title: day.title,
      eventCount: day.events.length
    });
    setShowDeleteDayDialog(true);
  };

  const handleConfirmDeleteDay = () => {
    if (!deletingDay) return;

    const updatedDays = timeline.days.filter((_, index) => index !== deletingDay.index);
    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
    
    if (currentDay >= updatedDays.length) {
      setCurrentDay(updatedDays.length - 1);
    }

    setShowDeleteDayDialog(false);
    setDeletingDay(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newEvent.time) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }
    if (!newEvent.title) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }
    if (!newEvent.description) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (editingEvent) {
      handleSaveEdit();
    } else {
      handleAddEvent();
    }
  };

  const handleAddEvent = async () => {
    try {
      const updatedDays = [...timeline.days];
      const currentDayData = { ...updatedDays[currentDay] };
      currentDayData.events = [...(currentDayData.events || []), newEvent];
      updatedDays[currentDay] = currentDayData;

      const updatedTimeline = { ...timeline, days: updatedDays };
      setTimeline(updatedTimeline);
      await saveTimeline(updatedTimeline);
      setNewEvent({ time: '', title: '', description: '', categoryId: 'other' });
      setError(null);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern');
    }
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
    setNewEvent({ time: '', title: '', description: '', categoryId: 'other' });
  };

  const handleUpdateDay = (dayIndex: number, updates: Partial<Day>) => {
    const updatedDays = [...timeline.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      ...updates
    };
    const updatedTimeline = { ...timeline, days: updatedDays };
    setTimeline(updatedTimeline);
    saveTimeline(updatedTimeline);
  };

  const handleAddCategory = async (category: Category) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        await loadCategories();
        setShowCategoryModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Fehler beim Hinzufügen der Kategorie');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Kategorie:', error);
      alert('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleMoveEvent = (eventIndex: number) => {
    setMovingEvent({ dayIndex: currentDay, eventIndex });
    setShowMoveDialog(true);
  };

  const handleConfirmMove = async (targetDayIndex: number) => {
    if (!movingEvent) return;

    try {
      setIsLoading(true);
      const updatedDays = [...timeline.days];
      const sourceDay = { ...updatedDays[movingEvent.dayIndex] };
      const targetDay = { ...updatedDays[targetDayIndex] };

      // Entferne das Event aus dem Quell-Tag
      const [movedEvent] = sourceDay.events.splice(movingEvent.eventIndex, 1);
      // Füge das Event zum Ziel-Tag hinzu
      targetDay.events.push(movedEvent);

      updatedDays[movingEvent.dayIndex] = sourceDay;
      updatedDays[targetDayIndex] = targetDay;

      const updatedTimeline = { ...timeline, days: updatedDays };
      
      // Speichere die aktualisierte Timeline
      await saveTimeline(updatedTimeline);
      setTimeline(updatedTimeline);

      setShowMoveDialog(false);
      setMovingEvent(null);
    } catch (error) {
      console.error('Fehler beim Verschieben des Events:', error);
      alert('Fehler beim Verschieben des Events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-gray-700">Wird aktualisiert...</p>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-[#460b6c]">Timeline verwalten</h3>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="px-3 py-2 bg-[#ff9900] text-white rounded hover:bg-orange-600 flex items-center gap-2"
        >
          <FaPlus /> Neue Kategorie
        </button>
      </div>

      <div className="space-y-6">
        <CategoryList 
          categories={categories} 
          onDeleteClick={handleDeleteCategoryClick} 
        />

        <DayNavigation
          days={timeline.days}
          currentDay={currentDay}
          editingDay={editingDay}
          newDayTitle={newDayTitle}
          onDaySelect={setCurrentDay}
          onEditDay={setEditingDay}
          onNewDayTitleChange={setNewDayTitle}
          onDeleteDay={handleDeleteDay}
          onAddDay={handleAddDay}
          onUpdateDay={handleUpdateDay}
        />

        <EventList
          events={timeline.days[currentDay]?.events || []}
          categories={categories}
          onEditEvent={(eventIndex: number) => {
            const event = timeline.days[currentDay].events[eventIndex];
            setEditingEvent({ dayIndex: currentDay, eventIndex });
            setNewEvent(event);
          }}
          onDeleteEvent={handleDeleteEvent}
          onMoveEvent={handleMoveEvent}
        />

        <EventForm
          event={newEvent}
          categories={categories}
          isEditing={editingEvent !== null}
          onSubmit={handleSubmit}
          onChange={setNewEvent}
          onCancel={() => setEditingEvent(null)}
          error={error}
        />
      </div>

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onAddCategory={handleAddCategory}
          onLoadCategories={loadCategories}
        />
      )}

      {showDeleteDialog && deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setDeletingCategory(null);
          }}
        />
      )}

      {showDeleteDayDialog && deletingDay && (
        <DeleteDayDialog
          dayTitle={deletingDay.title}
          eventCount={deletingDay.eventCount}
          onConfirm={handleConfirmDeleteDay}
          onCancel={() => {
            setShowDeleteDayDialog(false);
            setDeletingDay(null);
          }}
        />
      )}

      {showMoveDialog && movingEvent && (
        <MoveEventDialog
          days={timeline.days}
          currentDayIndex={movingEvent.dayIndex}
          onConfirm={handleConfirmMove}
          onCancel={() => {
            setShowMoveDialog(false);
            setMovingEvent(null);
          }}
        />
      )}
    </div>
  );
} 