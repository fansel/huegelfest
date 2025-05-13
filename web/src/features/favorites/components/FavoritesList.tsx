'use client';

import React, { useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { TimelineEventCard } from '@/features/timeline/components/TimelineEventCard';
import * as LucideIcons from 'lucide-react';
import { useTimeline } from '@/features/timeline/hooks/useTimeline';

export const FavoritesList: React.FC = () => {
  const { favorites } = useFavorites();
  const { timeline } = useTimeline();

  // Dynamisches Icon-Mapping wie in Timeline
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.HelpCircle;
  };

  // Favoriten nach Tag gruppieren
  const grouped = useMemo(() => {
    const map: Record<string, typeof favorites[number][]> = {};
    favorites.forEach((fav) => {
      const day = fav.data?.dayTitle || 'Ohne Tag';
      if (!map[day]) map[day] = [];
      map[day].push(fav);
    });
    return map;
  }, [favorites]);

  // Alphabetisch sortierte Tagesnamen
  const sortedDays = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  // Hilfsfunktion zur Datumsformatierung (dd.mm.yyyy)
  const formatDate = (dateInput?: string) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (favorites.length === 0) {
    return (
      <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
        Noch keine Favoriten gespeichert.
      </div>
    );
  }

  return (
    <div className="py-6 px-2 flex flex-col items-center min-h-[40vh]">
      <h3 className="text-xl font-bold mb-6 text-[#ff9900] tracking-wide text-center drop-shadow">Meine Favoriten</h3>
      <div className="w-full max-w-3xl flex flex-col gap-10">
        {sortedDays.map(day => {
          // Datum aus Timeline, sonst aus Favorit nehmen
          const firstFav = grouped[day][0];
          const timelineDay = timeline?.days.find(d => d.title.trim().toLowerCase() === day.trim().toLowerCase());
          const dayDate = timelineDay?.date || firstFav?.data?.dayDate;
          return (
            <section key={day} className="mb-2">
              <h4 className="text-lg font-semibold text-[#ff9900] mb-3 border-b border-[#ff9900]/30 pb-1 pl-1 flex items-center gap-2">
                <span>{day}</span>
                {dayDate && (
                  <span className="text-xs text-[#ff9900]/60 font-normal ml-2 align-middle">{formatDate(dayDate)}</span>
                )}
              </h4>
              <div className="flex flex-col gap-3">
                {grouped[day].map((fav) => {
                  const category = typeof fav.data?.categoryIcon === 'string'
                    ? { icon: fav.data.categoryIcon }
                    : undefined;
                  return (
                    <TimelineEventCard
                      key={fav.id}
                      event={fav.data}
                      dayTitle={day}
                      category={category}
                      getIconComponent={getIconComponent}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}; 