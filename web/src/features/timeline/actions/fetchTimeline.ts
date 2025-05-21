"use server";

import { fetchDays } from './fetchDays';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import { fetchApprovedEventsByDay } from './fetchApprovedEventsByDay';
import type { TimelineData } from '../types/types';

/**
 * Aggregiert alle Daten für die Timeline: Tage, Kategorien, Events
 */
export async function fetchTimeline(): Promise<TimelineData> {
  const daysRaw = await fetchDays();
  const categories = await getCategoriesAction();
  const days = await Promise.all(
    daysRaw.map(async (day: any) => {
      const events = await fetchApprovedEventsByDay(day._id);
      return { ...day, events };
    })
  );
  return { days, categories };
} 