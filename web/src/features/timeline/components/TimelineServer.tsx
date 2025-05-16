import React from 'react';
import { fetchDays } from '../actions/fetchDays';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { fetchApprovedEventsByDay } from '@/features/timeline/actions/fetchApprovedEventsByDay';
import type { Category, Day, Event } from '../types/types';
import TimelineClient from './TimelineClient';

interface TimelineServerProps {
  showFavoritesOnly?: boolean;
  allowClipboard?: boolean;
}

/**
 * Server-Komponente: Lädt alle Daten für die Timeline serverseitig und übergibt sie an die Client-Komponente.
 */
const TimelineServer: React.FC<TimelineServerProps> = async ({ showFavoritesOnly = false, allowClipboard = false }) => {
  try {
    const daysRaw = await fetchDays();
    const categories = await getCategoriesAction();
    // Events für jeden Tag laden
    const days: Day[] = await Promise.all(
      daysRaw.map(async (day: any) => {
        const events: Event[] = await fetchApprovedEventsByDay(day._id);
        return {
          ...day,
          events,
        };
      })
    );
    return (
      <TimelineClient
        days={days}
        categories={categories}
        showFavoritesOnly={showFavoritesOnly}
        allowClipboard={allowClipboard}
      />
    );
  } catch (error: any) {
    return <div className="text-red-500">Fehler beim Laden der Timeline: {error.message}</div>;
  }
};

export default TimelineServer;

export async function getTimelineData() {
  const daysRaw = await fetchDays();
  const categories = await getCategoriesAction();
  const days = await Promise.all(
    daysRaw.map(async (day: any) => {
      const events: Event[] = await fetchApprovedEventsByDay(day._id);
      return {
        ...day,
        events,
      };
    })
  );
  return { days, categories };
} 