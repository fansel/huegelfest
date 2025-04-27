'use client';

import React, { useEffect, useState } from 'react';
import { FaMusic, FaUsers, FaUtensils, FaCampground, FaGamepad, FaQuestion, FaFilter } from 'react-icons/fa';

interface Event {
  time: string;
  title: string;
  description: string;
  category: 'music' | 'workshop' | 'food' | 'camp' | 'game' | 'other';
}

interface Day {
  title: string;
  description: string;
  events: Event[];
}

interface TimelineData {
  days: Day[];
}

const categoryOptions = [
  { value: 'music', label: 'Musik', icon: <FaMusic className="text-[#ff9900]" /> },
  { value: 'workshop', label: 'Workshop', icon: <FaUsers className="text-[#ff9900]" /> },
  { value: 'food', label: 'Essen & Trinken', icon: <FaUtensils className="text-[#ff9900]" /> },
  { value: 'camp', label: 'Camp', icon: <FaCampground className="text-[#ff9900]" /> },
  { value: 'game', label: 'Spiele', icon: <FaGamepad className="text-[#ff9900]" /> },
  { value: 'other', label: 'Sonstiges', icon: <FaQuestion className="text-[#ff9900]" /> }
];

export default function Timeline() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showMobileCategories, setShowMobileCategories] = useState(false);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const response = await fetch('/api/timeline');
        const data = await response.json();
        setTimelineData(data);
      } catch (error) {
        console.error('Fehler beim Laden der Timeline:', error);
      }
    };

    loadTimeline();
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

  if (!timelineData) {
    return <div className="flex justify-center items-center h-64 text-[#ff9900]">Lade Timeline...</div>;
  }

  const filteredEvents = timelineData.days[currentDay].events.filter(event => 
    selectedCategories.size === 0 || selectedCategories.has(event.category)
  );

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {timelineData.days.map((day, index) => (
            <button
              key={index}
              onClick={() => setCurrentDay(index)}
              className={`px-4 py-2 rounded-full transition-colors ${
                currentDay === index
                  ? 'bg-[#ff9900] text-[#460b6c]'
                  : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20'
              }`}
            >
              {day.title.split(' – ')[0]}
            </button>
          ))}
        </div>
        <div className="w-full">
          <div className="hidden md:flex flex-wrap justify-center gap-2 mb-6">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => toggleCategory(option.value)}
                className={`px-4 py-2 rounded-full transition-colors flex items-center space-x-2 ${
                  selectedCategories.has(option.value)
                    ? 'bg-[#ff9900] text-[#460b6c]'
                    : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <div className="md:hidden flex justify-center mb-6">
            <div className="relative">
              <button
                onClick={() => setShowMobileCategories(!showMobileCategories)}
                className="px-4 py-2 rounded-full bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20 transition-colors flex items-center space-x-2"
              >
                <FaFilter />
                <span>
                  {selectedCategories.size === 0 
                    ? 'Alle Kategorien' 
                    : `${selectedCategories.size} Kategorie${selectedCategories.size > 1 ? 'n' : ''} ausgewählt`}
                </span>
              </button>
              {showMobileCategories && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#460b6c] rounded-lg shadow-lg p-2 z-10">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategories(new Set());
                        setShowMobileCategories(false);
                      }}
                      className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        selectedCategories.size === 0
                          ? 'bg-[#ff9900] text-[#460b6c]'
                          : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20'
                      }`}
                    >
                      <span>Alle Kategorien</span>
                    </button>
                    {categoryOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          toggleCategory(option.value);
                        }}
                        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          selectedCategories.has(option.value)
                            ? 'bg-[#ff9900] text-[#460b6c]'
                            : 'bg-[#460b6c] text-[#ff9900] hover:bg-[#ff9900] hover:bg-opacity-20'
                        }`}
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => {
          const event = filteredEvents[index];
          return (
            <div
              key={index}
              className={`bg-[#460b6c] bg-opacity-50 rounded-lg p-4 hover:bg-opacity-70 transition-all border border-[#ff9900] border-opacity-30 ${
                !event ? 'hidden md:block' : ''
              }`}
            >
              {event ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[#ff9900] font-bold">{event.time}</div>
                    <div className="flex items-center gap-2">
                      {categoryOptions.find(opt => opt.value === event.category)?.icon}
                      <span className="text-[#ff9900] text-sm">
                        {categoryOptions.find(opt => opt.value === event.category)?.label}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{event.title}</h3>
                  <p className="text-[#ff9900] text-opacity-80">{event.description}</p>
                </>
              ) : (
                <div className="text-[#ff9900] text-opacity-50 text-center py-8">...</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 