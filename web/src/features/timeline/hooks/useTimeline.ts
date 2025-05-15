import { useState, useCallback } from 'react';
import { fetchDays } from '../actions/fetchDays';
import { fetchApprovedEventsByDay } from '@/features/timeline/actions/fetchApprovedEventsByDay';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import type { Day } from '../types/types';
import type { Category } from '../types/types';

export function useTimeline() {
  const [days, setDays] = useState<Day[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const daysRes = await fetchDays();
      const cats = await getCategoriesAction();
      // Für jeden Day die Events laden
      const daysWithEvents: Day[] = [];
      for (const day of daysRes) {
        const events = await fetchApprovedEventsByDay(String(day._id));
        daysWithEvents.push({
          _id: day._id,
          title: day.title,
          description: day.description,
          date: day.date,
          events,
        });
      }
      setDays(daysWithEvents);
      setCategories(cats);
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Timeline');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    days,
    categories,
    loading,
    error,
    refetch,
  };
} 