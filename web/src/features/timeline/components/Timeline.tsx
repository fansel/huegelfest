'use client';

import React, { useEffect, useState } from 'react';
import {
  Music,
  Utensils,
  Gamepad2,
  HelpCircle,
  Heart,
  List,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { fetchDays } from '../actions/fetchDays';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { useFavorites } from '../../../features/favorites/hooks/useFavorites';
import { FavoriteButton } from '../../../features/favorites/components/FavoriteButton';
import { TimelineEventCard } from './TimelineEventCard';
import { useTimelineWebSocket } from '../hooks/useTimelineWebSocket';
import { EventSubmissionSheet } from './EventSubmissionSheet';
import type { Category, Event } from '../types/types';
import { createEvent } from '../actions/createEvent';
import type { IEvent } from '@/lib/db/models/Event';
import { fetchApprovedEventsByDay } from '@/features/timeline/actions/fetchApprovedEventsByDay';

// Typen ggf. aus features/timeline/types/types importieren
// import { Event, Category, TimelineData, TimelineProps } from '../types/types';

interface TimelineDay {
  _id?: string;
  title: string;
  date?: string; // Optionales Datum
  description: string;
  events: Event[];
}

interface TimelineData {
  days: TimelineDay[];
  categories: Category[];
  error?: string;
}

interface TimelineProps {
  showFavoritesOnly?: boolean;
  allowClipboard?: boolean;
}

// Dynamisches Icon-Mapping
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || HelpCircle;
};

// Hilfsfunktion zur Datumsformatierung (dd.mm.yyyy)
const formatDate = (dateInput?: string | { $date: string }): string | null => {
  if (!dateInput) return null;
  let dateString: string | undefined;
  if (typeof dateInput === 'string') {
    dateString = dateInput;
  } else if (typeof dateInput === 'object' && '$date' in dateInput) {
    dateString = dateInput.$date;
  }
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

function saveTimelineToCache(data: any) {
  try {
    localStorage.setItem('timelineData', JSON.stringify(data));
  } catch (e) {
    console.error('Fehler beim Speichern der Timeline im Cache:', e);
  }
}

function loadTimelineFromCache(): any | null {
  try {
    const cached = localStorage.getItem('timelineData');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('Fehler beim Laden der Timeline aus dem Cache:', e);
    return null;
  }
}

type EventSubmission = {
  dayId: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
  offeredBy?: string;
};

export default function Timeline({ showFavoritesOnly = false, allowClipboard = false }: TimelineProps) {
  const [days, setDays] = useState<TimelineDay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showSubmissionSheet, setShowSubmissionSheet] = useState(false);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const updateCount = useTimelineWebSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const daysRes = await fetchDays();
        const cats = await getCategoriesAction();
        // Für jeden Day die Events laden
        const daysWithEvents: TimelineDay[] = [];
        for (const day of daysRes) {
          const events = await fetchApprovedEventsByDay(String(day._id));
          daysWithEvents.push({
            _id: String(day._id),
            title: day.title,
            description: day.description ?? '',
            date: day.date ? String(day.date) : undefined,
            events: events as Event[],
          });
        }
        setDays(daysWithEvents);
        setCategories(cats);
      } catch (e: any) {
        setError(e?.message || 'Fehler beim Laden der Timeline');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reload]);

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  // Event-Submission-Handler
  const handleEventSubmit = async (event: Omit<Event, '_id' | 'favorite' | 'status' | 'moderationComment' | 'submittedAt' | 'submittedByAdmin'> & { dayId: string; offeredBy?: string }) => {
    try {
      const eventData: EventSubmission = {
        dayId: event.dayId,
        time: event.time,
        title: event.title,
        description: event.description,
        categoryId: typeof event.categoryId === 'string' ? event.categoryId : (event.categoryId as any)?.$oid || '',
        ...(event.offeredBy ? { offeredBy: event.offeredBy } : {}),
      };
      await createEvent(eventData);
      setShowSubmissionSheet(false);
      setReload(r => r + 1); // Timeline neu laden
    } catch (err: any) {
      alert('Fehler beim Einreichen des Events: ' + (err?.message || 'Unbekannter Fehler'));
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-[#ff9900]">Lade Timeline...</div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center h-64 text-[#ff9900]">{error}</div>;
  }

  // Hinweis bei komplett leeren Tagen
  const noDays = days.length === 0;
  const noEvents = !noDays && days[selectedDay]?.events?.length === 0;

  const currentDay = days[selectedDay];
  const filteredEvents = currentDay?.events?.filter(
    (event) => {
      if (selectedCategories.size === 0) return true;
      const category = categories.find(c => c._id === event.categoryId);
      return category && selectedCategories.has(category._id);
    }
  ) ?? [];

  // Filter für showFavoritesOnly
  const displayedEvents = showFavoritesOnly
    ? filteredEvents.filter(event => isFavorite(`${currentDay?.title ?? ''}-${event.time}-${event.title}`))
    : filteredEvents;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-2 px-4">
        {/* Tage-Auswahl für Desktop */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {days.map((day, index) => (
            <button
              key={day._id || `day-${index}`}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                selectedDay === index
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
            >
              {day.title}
            </button>
          ))}
        </div>

        {/* Tage-Auswahl für Mobile/PWA */}
        <div className="md:hidden flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
          {days.map((day, index) => (
            <button
              key={day._id || `day-${index}`}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-full transition-colors duration-200 ${
                selectedDay === index
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
              }`}
            >
              {day.title}
            </button>
          ))}
        </div>

        {/* Filter-Icons und Labels in zwei Reihen */}
        <div className="mt-2">
          {/* Erste Reihe: Filter-Icons */}
          <div className="flex justify-center">
            <div className="flex space-x-2 overflow-x-auto pb-2 px-4">
              <button
                onClick={() => setSelectedCategories(new Set())}
                className={`flex-shrink-0 p-2.5 rounded-full transition-colors duration-200 ${
                  selectedCategories.size === 0
                    ? 'bg-[#ff9900] text-[#460b6c]'
                    : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
                }`}
                title="Alle Kategorien"
              >
                <List className="text-lg" />
              </button>
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <button
                    key={category._id}
                    onClick={() => toggleCategory(category._id)}
                    className={`flex-shrink-0 p-2.5 rounded-full transition-colors duration-200 ${
                      selectedCategories.has(category._id)
                        ? 'bg-[#ff9900] text-[#460b6c]'
                        : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
                    }`}
                    title={category.label}
                  >
                    <IconComponent className="text-lg" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zweite Reihe: Labels für ausgewählte Kategorien */}
          {selectedCategories.size > 0 && (
            <div className="flex justify-center mt-2">
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from(selectedCategories).map((categoryId) => {
                  const category = categories.find((c) => c._id === categoryId);
                  if (!category) return null;
                  return (
                    <span
                      key={categoryId}
                      className="px-2 py-1 bg-[#ff9900]/20 text-[#ff9900] rounded-full text-sm"
                    >
                      {category.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Dezent platzierter kleiner Button unterhalb der Tages-/Filterauswahl */}
      <div className="flex justify-center my-4">
        <button
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#ff9900]/20 text-[#ff9900] text-xs font-medium hover:bg-[#ff9900]/30 transition border border-[#ff9900]/30 shadow-none"
          style={{ minHeight: 0, minWidth: 0 }}
          onClick={() => setShowSubmissionSheet(true)}
        >
          <span className="text-base leading-none">＋</span> Event vorschlagen
        </button>
      </div>
      {/* EventSubmissionSheet */}
      <EventSubmissionSheet
        open={showSubmissionSheet}
        onClose={() => setShowSubmissionSheet(false)}
        categories={categories}
        days={days as any[]}
        onSubmit={handleEventSubmit}
      />
      {/* Hinweis bei leeren Tagen/Events */}
      {noDays ? (
        <div className="text-center text-[#ff9900]/80 py-12 text-lg">
          Noch keine Tage oder Events vorhanden.<br />
          Sei der/die Erste, der/die ein Event vorschlägt!
        </div>
      ) : days[selectedDay]?.events?.length === 0 ? (
        <div className="text-center text-[#ff9900]/80 py-8 text-base">
          Für diesen Tag sind noch keine Events vorhanden.<br />
          Schlage jetzt ein Event vor!
        </div>
      ) : (
        <>
          {!showFavoritesOnly && (
            <div className="relative px-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
              {displayedEvents.map((event) => {
                const day = days[selectedDay];
                const category = categories.find((c) => c._id === event.categoryId);
                return (
                  <TimelineEventCard
                    key={`${day._id}-${event.time}-${event.title}`}
                    event={event}
                    dayTitle={day.title}
                    category={category}
                    getIconComponent={getIconComponent}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}