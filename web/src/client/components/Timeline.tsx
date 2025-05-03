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

interface Event {
  _id?: string;
  time: string;
  title: string;
  description: string;
  categoryId: string;
  favorite?: boolean;
}

interface Category {
  value: string;
  label: string;
  icon: string;
}

interface TimelineData {
  days: {
    _id?: string;
    title: string;
    events: Event[];
  }[];
  categories: Category[];
}

interface TimelineProps {
  showFavoritesOnly?: boolean;
}

// Statisches Icon-Mapping
const iconMap: { [key: string]: React.ComponentType } = {
  FaMusic,
  FaUtensils,
  FaGamepad,
  FaQuestion,
  FaHeart,
  FaList,
};

export default function Timeline({ showFavoritesOnly = false }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        // Lade Timeline-Daten
        const timelineResponse = await fetch('/api/timeline');
        const timelineData = await timelineResponse.json();

        // Lade Kategorien
        const categoriesResponse = await fetch('/api/categories');
        const categoriesData = await categoriesResponse.json();

        // Mappe die Kategorien mit den entsprechenden Icons
        const categoriesWithIcons = categoriesData.map((category: Category) => {
          const iconMap: { [key: string]: string } = {
            music: 'FaMusic',
            food: 'FaUtensils',
            activities: 'FaGamepad',
            other: 'FaQuestion'
          };
          return {
            ...category,
            icon: iconMap[category.value] || 'FaQuestion'
          };
        });

        setTimelineData({
          ...timelineData,
          categories: categoriesWithIcons,
        });

        // Lade Favoriten aus dem localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');

        // Markiere favorisierte Events
        const timelineWithFavorites = {
          ...timelineData,
          categories: categoriesWithIcons,
          days: timelineData.days.map((day: { _id?: string; title: string; events: Event[] }) => ({
            ...day,
            events: day.events.map((event: Event) => ({
              ...event,
              favorite: favorites[`${day.title}-${event.time}-${event.title}`] || false,
            })),
          })),
        };

        setTimelineData(timelineWithFavorites);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      }
    };

    loadData();
  }, []);

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

  // Überprüfe, ob der ausgewählte Tag existiert
  if (!timelineData.days[selectedDay]) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#ff9900]">
        <p className="text-xl font-medium mb-2">
          Das Programm ist noch nicht bekanntgegeben
        </p>
        <p className="text-sm text-[#ff9900]/80">Schau später nochmal vorbei</p>
      </div>
    );
  }

  const filteredEvents = timelineData.days[selectedDay].events.filter(
    (event) => selectedCategories.size === 0 || selectedCategories.has(event.categoryId),
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
                const IconComponent = iconMap[category.icon] || FaQuestion;
                return (
                  <button
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`flex-shrink-0 p-2.5 rounded-full transition-colors duration-200 ${
                      selectedCategories.has(category.value)
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
                  const category = timelineData?.categories.find((c) => c.value === categoryId);
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
          <div className="space-y-4">
            {timelineData.days[selectedDay].events.filter((event) => event.favorite).length > 0 ? (
              timelineData.days[selectedDay].events.map((event) => (
                <div
                  key={`${event.time}-${event.title}`}
                  className="bg-[#460b6c]/40 backdrop-blur-sm rounded-lg p-3 border border-[#ff9900]/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-[#ff9900] font-medium">
                        {event.time} - {event.title}
                      </h5>
                      {event.description && (
                        <p className="text-[#ff9900]/60 text-xs mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite(timelineData.days[selectedDay].title, event)}
                      className="text-[#ff9900] p-1"
                    >
                      <FaHeart />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#ff9900]/60 text-center py-4">
                Keine Favoriten vorhanden
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {!showFavoritesOnly && (
            <div className="relative px-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
              {filteredEvents.map((event) => {
                const category = timelineData.categories.find((c) => c.value === event.categoryId);
                const IconComponent = category ? iconMap[category.icon] || FaQuestion : FaQuestion;
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
                      <div className="text-[#ff9900] text-sm">{event.time}</div>
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