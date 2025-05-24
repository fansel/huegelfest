'use client';

import React, { useMemo } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { FavoriteItem } from '../types/favorites';
import { TimelineEventCard } from '@/features/timeline/components/TimelineEventCard';
import { FavoriteButton } from './FavoriteButton';
import * as LucideIcons from 'lucide-react';

export const FavoritesList: React.FC = () => {
  const { favorites, timelineData, isLoading } = useFavorites();

  // Dynamisches Icon-Mapping wie in Timeline
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.HelpCircle;
  };

  // Favoriten nach Tag gruppieren
  const grouped = useMemo(() => {
    const map: Record<string, FavoriteItem[]> = {};
    favorites.forEach((fav) => {
      const day = (fav.data as any)?.dayTitle || 'Ohne Tag';
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

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#ff9900]/60 text-base font-medium">
        Lade Favoriten...
      </div>
    );
  }

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
          const timelineDay = timelineData?.days?.find((d: any) => d.title.trim().toLowerCase() === day.trim().toLowerCase());
          const dayDate = timelineDay?.date || (firstFav?.data as any)?.dayDate;
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
                  // Event-ID aus Favorit extrahieren
                  const eventId = (fav.data as any)?.id || (fav.data as any)?._id;
                  const eventTime = (fav.data as any)?.time;
                  const eventTitle = (fav.data as any)?.title;
                  
                  // Hybrid-Ansatz: Online = aktuelle Timeline-Daten, Offline = localStorage-Daten
                  let eventToDisplay = fav.data; // Fallback: localStorage-Daten (offline)
                  let categoryToDisplay = typeof (fav.data as any)?.categoryIcon === 'string'
                    ? { icon: (fav.data as any).categoryIcon }
                    : undefined;

                  // Wenn Timeline-Daten verfügbar sind (online), nutze aktuelle Daten
                  if (timelineData?.days) {
                    const timelineDay = timelineData.days.find((d: any) => 
                      d.title.trim().toLowerCase() === day.trim().toLowerCase()
                    );
                    
                    const currentEvent = timelineDay?.events?.find((e: any) => {
                      // Versuche verschiedene Matching-Strategien
                      if (eventId && (e._id === eventId || e.id === eventId)) return true;
                      // Fallback: Zeit + Titel matching (für alte Favoriten ohne ID)
                      return e.time === eventTime && e.title === eventTitle;
                    });

                    if (currentEvent) {
                      // Aktuelle Timeline-Daten verwenden (online)
                      eventToDisplay = currentEvent;
                      
                      // Aktuelle Kategorie aus Timeline-Daten holen
                      const currentCategory = timelineData.categories?.find((c: any) => 
                        c._id === currentEvent.categoryId || c.id === currentEvent.categoryId
                      );
                      
                      categoryToDisplay = currentCategory?.icon 
                        ? { icon: currentCategory.icon }
                        : undefined;
                    } else if (!isLoading) {
                      // Event nicht mehr in Timeline gefunden (wurde gelöscht)
                      return (
                        <div key={fav.id} className="bg-[#460b6c]/30 backdrop-blur-sm border border-[#ff9900]/20 rounded-lg p-4 opacity-60">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-[#ff9900]/20 rounded-full">
                                <LucideIcons.AlertTriangle className="text-[#ff9900] text-lg" />
                              </div>
                              <div>
                                <h3 className="text-[#ff9900] font-medium">{eventTitle || 'Event nicht mehr verfügbar'}</h3>
                                <p className="text-white/60 text-sm mt-1">Dieses Event wurde gelöscht.</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-[#ff9900]/60 text-sm">{eventTime || '—'}</div>
                              <FavoriteButton
                                item={{
                                  id: fav.id,
                                  type: fav.type,
                                  data: fav.data,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    // Wenn isLoading=true, nutze localStorage-Daten als Fallback
                  }
                  // Wenn keine Timeline-Daten (offline), nutze localStorage-Daten

                  return (
                    <TimelineEventCard
                      key={fav.id}
                      event={eventToDisplay}
                      dayTitle={day}
                      category={categoryToDisplay}
                      getIconComponent={getIconComponent}
                      favoriteButtonProps={{
                        item: {
                          id: fav.id, // Originale Favorit-ID verwenden!
                          type: fav.type,
                          data: { 
                            ...eventToDisplay, 
                            dayTitle: day,
                            // Zusätzliche Daten für Offline-Fallback beibehalten
                            categoryIcon: (fav.data as any)?.categoryIcon,
                            compositeId: (fav.data as any)?.compositeId
                          },
                        },
                      }}
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