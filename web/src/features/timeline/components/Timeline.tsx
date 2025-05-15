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
import { fetchTimeline } from '../../timeline/actions/fetchTimeline';
import { getCategoriesAction } from '../../categories/actions/getCategories';
import { useFavorites } from '../../../features/favorites/hooks/useFavorites';
import { FavoriteButton } from '../../../features/favorites/components/FavoriteButton';
import { TimelineEventCard } from './TimelineEventCard';
import { useTimelineWebSocket } from '../hooks/useTimelineWebSocket';

// Typen ggf. aus features/timeline/types/types importieren
// import { Event, Category, TimelineData, TimelineProps } from '../types/types';

interface Event {
  _id?: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
  favorite?: boolean;
}

interface Category {
  _id: string;
  value: string;
  label: string;
  icon: string;
  color?: string;
  description?: string;
  isDefault?: boolean;
}

interface TimelineDay {
  _id?: string;
  title: string;
  date?: string; // Optionales Datum
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

export default function Timeline({ showFavoritesOnly = false, allowClipboard = false }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const updateCount = useTimelineWebSocket();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Timeline] Starte Datenladung (Actions)');
        const timelineResult = await fetchTimeline();
        const categoriesResult = await getCategoriesAction();
        if (!timelineResult || (Array.isArray((timelineResult as any).days) && (timelineResult as any).days.length === 0)) {
          setTimelineData({ days: [], categories: [], error: 'Das Programm ist noch nicht bekanntgegeben' });
          return;
        }
        if (!categoriesResult || !Array.isArray(categoriesResult)) {
          setTimelineData({ days: [], categories: [], error: 'Kategorien konnten nicht geladen werden' });
          return;
        }
        // Markiere favorisierte Events über useFavorites
        const timelineWithFavorites = {
          ...timelineResult,
          categories: categoriesResult,
          days: (timelineResult as any).days.map((day: { _id?: string; title: string; events: Event[] }) => ({
            ...day,
            events: day.events.map((event: Event) => ({
              ...event,
              favorite: isFavorite(`${day.title}-${event.time}-${event.title}`),
            })),
          })),
        };
        setTimelineData(timelineWithFavorites);
        // Timeline im LocalStorage speichern
        saveTimelineToCache(timelineWithFavorites);
      } catch (error) {
        console.error('[Timeline] Fehler beim Laden der Daten (Actions):', error);
        // Fallback: Timeline aus LocalStorage laden
        const cached = loadTimelineFromCache();
        if (cached) {
          setTimelineData(cached);
        } else {
          setTimelineData({ days: [], categories: [], error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
        }
      }
    };
    loadData();
    const handleTimelineUpdate = () => { setLastUpdate(Date.now()); };
    window.addEventListener('timeline-update', handleTimelineUpdate);
    return () => { window.removeEventListener('timeline-update', handleTimelineUpdate); };
  }, [lastUpdate, isFavorite, updateCount]);

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  if (!timelineData) {
    return (
      <div className="flex justify-center items-center h-64 text-[#ff9900]">
        Lade Timeline...
      </div>
    );
  }

  // Zeige Fehlermeldung an, wenn ein Fehler aufgetreten ist oder keine Daten vorhanden sind
  if (timelineData.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#ff9900]">
        <p className="text-sm text-[#ff9900]/80">Hier gibt es noch nichts zu sehen ;)</p>
      </div>
    );
  }

  // Überprüfe, ob der ausgewählte Tag existiert
  if (!timelineData.days[selectedDay]) {
    setSelectedDay(0);
    return null;
  }

  const filteredEvents = timelineData.days[selectedDay].events.filter(
    (event) => {
      if (selectedCategories.size === 0) return true;
      const category = timelineData.categories.find(c => c._id === event.categoryId);
      return category && selectedCategories.has(category._id);
    }
  );

  // Filter für showFavoritesOnly
  const displayedEvents = showFavoritesOnly
    ? filteredEvents.filter(event => isFavorite(`${timelineData.days[selectedDay].title}-${event.time}-${event.title}`))
    : filteredEvents;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-2 px-4">
        {/* Tage-Auswahl für Desktop */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {timelineData.days.map((day, index) => (
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
          {timelineData.days.map((day, index) => (
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
              {timelineData?.categories.map((category) => {
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
                  const category = timelineData?.categories.find((c) => c._id === categoryId);
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

      {showFavoritesOnly ? (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-[#ff9900]">Meine Favoriten</h3>
          <div className="space-y-6">
            {(() => {
              // Alle Tage mit Favoriten filtern
              const daysWithFavorites = timelineData.days
                .map((day) => ({
                  dayTitle: day.title,
                  favoriteEvents: day.events.filter((event) => event.favorite),
                }))
                .filter(({ favoriteEvents }) => favoriteEvents.length > 0);
              if (daysWithFavorites.length === 0) {
                return <p className="text-[#ff9900]/60 text-center py-4">Keine Favoriten vorhanden</p>;
              }
              return daysWithFavorites.map(({ dayTitle, favoriteEvents }) => {
                // Robuster Vergleich für Tag
                const day = timelineData.days.find(
                  (d) => d.title.trim().toLowerCase() === dayTitle.trim().toLowerCase()
                );
                // Debug-Ausgabe
                console.log('Favoriten-Gruppierung:', { days: timelineData.days, dayTitle, foundDay: day });
                return (
                  <div key={dayTitle}>
                    <h4 className="text-[#ff9900] font-semibold mb-2 text-base flex items-center gap-2">
                      <span>{dayTitle}</span>
                      {day?.date
                        ? (
                          <span className="text-xs text-[#ff9900]/60 font-normal ml-2">{formatDate(day.date)}</span>
                        )
                        : (
                          <span className="text-xs text-red-400 ml-2">(kein Datum)</span>
                        )}
                    </h4>
                    <div className="space-y-4">
                      {favoriteEvents.map((event) => {
                        const category = timelineData.categories.find((c) => c._id === event.categoryId);
                        return (
                          <TimelineEventCard
                            key={`${dayTitle}-${event.time}-${event.title}`}
                            event={event}
                            dayTitle={dayTitle}
                            category={category}
                            getIconComponent={getIconComponent}
                            favoriteButtonProps={{
                              item: {
                                id: `${dayTitle}-${event.time}-${event.title}`,
                                type: 'timeline' as const,
                                data: {
                                  ...event,
                                  dayTitle,
                                  dayDate: day?.date,
                                  categoryIcon: category?.icon,
                                },
                              },
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <>
          {!showFavoritesOnly && (
            <div className="relative px-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
              {displayedEvents.map((event) => {
                const day = timelineData.days[selectedDay];
                const category = timelineData.categories.find((c) => c._id === event.categoryId);
                return (
                  <TimelineEventCard
                    key={`${event.time}-${event.title}`}
                    event={event}
                    dayTitle={day.title}
                    category={category}
                    getIconComponent={getIconComponent}
                    favoriteButtonProps={{
                      item: {
                        id: `${day.title}-${event.time}-${event.title}`,
                        type: 'timeline' as const,
                        data: {
                          ...event,
                          dayTitle: day.title,
                          dayDate: day.date,
                          categoryIcon: category?.icon,
                        },
                      },
                    }}
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