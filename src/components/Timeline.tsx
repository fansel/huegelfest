'use client';

import React, { useEffect, useState } from 'react';

interface Event {
  time: string;
  title: string;
  description: string;
}

interface Day {
  title: string;
  description: string;
  events: Event[];
}

interface TimelineData {
  days: Day[];
}

export default function Timeline() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(0);

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

  if (!timelineData) {
    return <div className="flex justify-center items-center h-64 text-[#ff9900]">Lade Timeline...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#ff9900]">Programmübersicht</h2>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timelineData.days[currentDay].events.map((event, index) => (
          <div
            key={index}
            className="bg-[#460b6c] bg-opacity-50 rounded-lg p-4 hover:bg-opacity-70 transition-all border border-[#ff9900] border-opacity-30"
          >
            <div className="text-[#ff9900] font-bold mb-2">{event.time}</div>
            <h3 className="text-lg font-semibold mb-2 text-white">{event.title}</h3>
            <p className="text-[#ff9900] text-opacity-80">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 