'use client';

import React, { useEffect, useState } from 'react';
import { FaMusic, FaUsers, FaUtensils, FaCampground, FaGamepad, FaQuestion, FaFilter, FaHeart, FaRegHeart } from 'react-icons/fa';
import { usePWA } from '../contexts/PWAContext';
import Image from 'next/image';

interface Event {
  time: string;
  title: string;
  description: string;
  category: 'music' | 'workshop' | 'food' | 'camp' | 'game' | 'other';
  favorite?: boolean;
}

interface Day {
  title: string;
  description: string;
  events: Event[];
}

interface TimelineData {
  days: Day[];
}

interface FavoriteEventsByDay {
  [dayTitle: string]: Event[];
}

interface TimelineProps {
  showFavoritesOnly?: boolean;
}

const categoryOptions = [
  { value: 'music', label: 'Musik', icon: <FaMusic className="text-[#ff9900]" /> },
  { value: 'workshop', label: 'Workshop', icon: <FaUsers className="text-[#ff9900]" /> },
  { value: 'food', label: 'Essen & Trinken', icon: <FaUtensils className="text-[#ff9900]" /> },
  { value: 'camp', label: 'Camp', icon: <FaCampground className="text-[#ff9900]" /> },
  { value: 'game', label: 'Spiele', icon: <FaGamepad className="text-[#ff9900]" /> },
  { value: 'other', label: 'Sonstiges', icon: <FaQuestion className="text-[#ff9900]" /> }
];

export default function Timeline({ showFavoritesOnly = false }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const { isPWA } = usePWA();

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const response = await fetch('/api/timeline');
        const data = await response.json();
        
        // Lade Favoriten aus dem localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
        
        // Markiere favorisierte Events
        const timelineWithFavorites = {
          ...data,
          days: data.days.map((day: Day) => ({
            ...day,
            events: day.events.map((event: Event) => ({
              ...event,
              favorite: favorites[`${day.title}-${event.time}-${event.title}`] || false
            }))
          }))
        };
        
        setTimelineData(timelineWithFavorites);
      } catch (error) {
        console.error('Fehler beim Laden der Timeline:', error);
      }
    };

    loadTimeline();
  }, []);

  const handleScroll = () => {
    setIsScrolling(true);
  };

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
      days: timelineData.days.map(day => ({
        ...day,
        events: day.events.map(e => 
          e.time === event.time && e.title === event.title
            ? { ...e, favorite: newFavoriteState }
            : e
        )
      }))
    };
    
    setTimelineData(updatedTimeline);
  };

  const getFavoriteEvents = (): FavoriteEventsByDay => {
    if (!timelineData) return {};
    
    const favoriteEventsByDay: FavoriteEventsByDay = {};
    
    for (const day of timelineData.days) {
      const dayFavorites = day.events.filter(event => event.favorite);
      if (dayFavorites.length > 0) {
        favoriteEventsByDay[day.title] = dayFavorites;
      }
    }
    
    return favoriteEventsByDay;
  };

  if (!timelineData) {
    return <div className="flex justify-center items-center h-64 text-[#ff9900]">Lade Timeline...</div>;
  }

  const filteredEvents = timelineData.days[selectedDay].events.filter(event => 
    selectedCategories.size === 0 || selectedCategories.has(event.category)
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#460b6c]/90 backdrop-blur-sm py-4 px-4">
        <div className="flex items-center justify-start mb-4">
          {isPWA && (
            <Image
              src="/android-chrome-192x192.png"
              alt="Hügelfest Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
        </div>
        
        {showFavoritesOnly ? (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-[#ff9900]">Meine Favoriten</h3>
            <div className="space-y-4">
              {Object.keys(getFavoriteEvents()).length > 0 ? (
                Object.entries(getFavoriteEvents()).map(([dayTitle, events]) => (
                  <div key={dayTitle} className="bg-[#460b6c]/40 backdrop-blur-sm rounded-lg p-3 border border-[#ff9900]/20">
                    <h4 className="text-[#ff9900] font-medium mb-2">{dayTitle}</h4>
                    <div className="space-y-2">
                      {events.map((event: Event) => (
                        <div key={`${event.time}-${event.title}`} className="bg-[#460b6c]/60 backdrop-blur-sm rounded-lg p-2 border border-[#ff9900]/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-[#ff9900] font-medium">{event.time} - {event.title}</h5>
                              {event.description && (
                                <p className="text-[#ff9900]/60 text-xs mt-1">{event.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => toggleFavorite(dayTitle, event)}
                              className="text-[#ff9900] p-1"
                            >
                              <FaHeart />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#ff9900]/60 text-center py-4">Keine Favoriten vorhanden</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tage-Auswahl für Desktop */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {timelineData.days.map((day, index) => (
                <button
                  key={day.title}
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
                  key={day.title}
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

            {/* Kategoriefilter für Mobile/PWA */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  onClick={() => setSelectedCategories(new Set())}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    selectedCategories.size === 0
                      ? 'bg-[#ff9900] text-[#460b6c]'
                      : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
                  }`}
                  title="Alle Kategorien"
                >
                  <FaFilter className="text-base" />
                </button>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleCategory(option.value)}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      selectedCategories.has(option.value)
                        ? 'bg-[#ff9900] text-[#460b6c]'
                        : 'bg-[#460b6c] text-[#ff9900] border border-[#ff9900]/20'
                    }`}
                    title={option.label}
                  >
                    {React.cloneElement(option.icon, { className: "text-base" })}
                  </button>
                ))}
              </div>
              
              {/* Anzeige der ausgewählten Kategorien */}
              {selectedCategories.size > 0 && (
                <div className="mt-2 text-center">
                  <div className="inline-flex flex-wrap gap-1.5 justify-center">
                    {Array.from(selectedCategories).map(category => {
                      const option = categoryOptions.find(opt => opt.value === category);
                      return option ? (
                        <span 
                          key={category}
                          className="inline-flex items-center px-2 py-1 rounded-full bg-[#ff9900]/10 text-[#ff9900] text-sm"
                        >
                          {React.cloneElement(option.icon, { className: "text-xs mr-1" })}
                          {option.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!showFavoritesOnly && (
        <div 
          className="relative px-4"
          onScroll={handleScroll}
          onTouchStart={() => setIsScrolling(true)}
          onTouchEnd={() => setIsScrolling(false)}
        >
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#ff9900]/20" />
          {filteredEvents.map((event) => (
            <div
              key={`${event.time}-${event.title}`}
              className={`relative pl-8 mb-8 transition-opacity duration-200 ${
                isScrolling ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="absolute left-0 w-4 h-4 rounded-full bg-[#ff9900] transform -translate-x-2" />
              <div className="bg-[#460b6c]/40 backdrop-blur-sm rounded-lg p-4 border border-[#ff9900]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#ff9900] font-medium">{event.time}</span>
                  <div className="flex items-center gap-2">
                    {categoryOptions.find(opt => opt.value === event.category)?.icon}
                    <span className="text-[#ff9900]/60 text-sm">
                      {categoryOptions.find(opt => opt.value === event.category)?.label}
                    </span>
                    <button
                      onClick={() => toggleFavorite(timelineData.days[selectedDay].title, event)}
                      className={`p-1 rounded-full transition-colors duration-200 ${
                        event.favorite
                          ? 'text-[#ff9900]'
                          : 'text-[#ff9900]/40 hover:text-[#ff9900]/60'
                      }`}
                    >
                      {event.favorite ? <FaHeart /> : <FaRegHeart />}
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-1">{event.title}</h3>
                {event.description && (
                  <p className="text-[#ff9900]/80 text-sm">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 