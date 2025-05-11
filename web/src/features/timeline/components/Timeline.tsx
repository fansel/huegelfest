'use client';

import React, { useEffect, useState } from 'react';
import {
  FaMusic,
  FaUtensils,
  FaGamepad,
  FaQuestion,
  FaHeart,
  FaList,
} from 'react-icons/fa';
import * as Icons from 'react-icons/fa';
import { fetchTimeline } from '../../timeline/actions/fetchTimeline';
import { getCategoriesAction } from '../../categories/actions/getCategories';

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

interface TimelineData {
  days: {
    _id?: string;
    title: string;
    events: Event[];
  }[];
  categories: Category[];
  error?: string;
}

interface TimelineProps {
  showFavoritesOnly?: boolean;
  allowClipboard?: boolean;
}

// Dynamisches Icon-Mapping
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent || FaQuestion;
};

export default function Timeline({ showFavoritesOnly = false, allowClipboard = false }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Timeline] Starte Datenladung (Actions)');
        // Timeline-Daten per Action laden
        const timelineResult = await fetchTimeline();
        // Kategorien per Action laden
        const categoriesResult = await getCategoriesAction();

        // Fehlerbehandlung
        if (!timelineResult || (Array.isArray((timelineResult as any).days) && (timelineResult as any).days.length === 0)) {
          setTimelineData({
            days: [],
            categories: [],
            error: 'Das Programm ist noch nicht bekanntgegeben',
          });
          return;
        }
        if (!categoriesResult || !Array.isArray(categoriesResult)) {
          setTimelineData({
            days: [],
            categories: [],
            error: 'Kategorien konnten nicht geladen werden',
          });
          return;
        }

        // Favoriten aus localStorage
        let favorites: Record<string, boolean> = {};
        try {
          const favoritesStr = localStorage.getItem('favorites');
          if (favoritesStr) {
            favorites = JSON.parse(favoritesStr);
          }
        } catch (error) {
          console.error('[Timeline] Fehler beim Laden der Favoriten:', error);
          favorites = {};
        }

        // Markiere favorisierte Events
        const timelineWithFavorites = {
          ...timelineResult,
          categories: categoriesResult,
          days: (timelineResult as any).days.map((day: { _id?: string; title: string; events: Event[] }) => ({
            ...day,
            events: day.events.map((event: Event) => ({
              ...event,
              favorite: favorites[`${day.title}-${event.time}-${event.title}`] || false,
            })),
          })),
        };

        setTimelineData(timelineWithFavorites);
      } catch (error) {
        console.error('[Timeline] Fehler beim Laden der Daten (Actions):', error);
        setTimelineData({
          days: [],
          categories: [],
          error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
        });
      }
    };
    loadData();
    // Event-Listener für Timeline-Updates bleibt wie gehabt
    const handleTimelineUpdate = () => {
      setLastUpdate(Date.now());
    };
    window.addEventListener('timeline-update', handleTimelineUpdate);
    return () => {
      window.removeEventListener('timeline-update', handleTimelineUpdate);
    };
  }, [lastUpdate]);

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const toggleFavorite = (dayTitle: string, event: Event) => {
    if (!timelineData) return;

    const eventKey = `${dayTitle}-${event.time}-${event.title}`;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const newFavoriteState = !event.favorite;

    // Aktualisiere localStorage
    favorites[eventKey] = newFavoriteState;
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Aktualisiere Timeline-Daten
    const updatedTimeline = {
      ...timelineData,
      days: timelineData.days.map((day) => ({
        ...day,
        events: day.events.map((e) =>
          e.time === event.time && e.title === event.title
            ? { ...e, favorite: newFavoriteState }
            : e,
        ),
      })),
    };

    setTimelineData(updatedTimeline);
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
                <FaList className="text-lg" />
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
              return daysWithFavorites.map(({ dayTitle, favoriteEvents }) => (
                <div key={dayTitle}>
                  <h4 className="text-[#ff9900] font-semibold mb-2 text-base">{dayTitle}</h4>
                  <div className="space-y-4">
                    {favoriteEvents.map((event) => {
                      const category = timelineData.categories.find((c) => c._id === event.categoryId);
                      const IconComponent = category ? getIconComponent(category.icon) : FaQuestion;
                      return (
                        <div
                          key={`${dayTitle}-${event.time}-${event.title}`}
                          className="bg-[#460b6c]/40 backdrop-blur-sm rounded-lg p-3 border border-[#ff9900]/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-[#ff9900]/20 rounded-full">
                                <IconComponent className="text-[#ff9900] text-lg" />
                              </div>
                              <div>
                                <h5 className="text-[#ff9900] font-medium">
                                  {event.time} - {event.title}
                                </h5>
                                {event.description && (
                                  <p className="text-[#ff9900]/60 text-xs mt-1">{event.description}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleFavorite(dayTitle, event)}
                              className="text-[#ff9900] p-1"
                            >
                              <FaHeart />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
        <>
          {!showFavoritesOnly && (
            <div className="relative px-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
              {filteredEvents.map((event) => {
                const category = timelineData.categories.find((c) => c._id === event.categoryId);
                const IconComponent = category ? getIconComponent(category.icon) : FaQuestion;
                return (
                  <div
                    key={`${event.time}-${event.title}`}
                    className="bg-[#460b6c]/50 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-[#ff9900]/20 rounded-full">
                          <IconComponent className="text-[#ff9900] text-lg" />
                        </div>
                        <div>
                          <h3 className="text-[#ff9900] font-medium">{event.title}</h3>
                          <p className="text-white/80 text-sm mt-1">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-[#ff9900] text-sm">{event.time}</div>
                        <button
                          onClick={() => toggleFavorite(timelineData.days[selectedDay].title, event)}
                          className="text-[#ff9900] p-1"
                          title={event.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                          {event.favorite ? <FaHeart /> : <FaHeart style={{ fill: 'none', stroke: '#ff9900', strokeWidth: 2 }} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}