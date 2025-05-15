"use server";

import { getDays } from '@/features/timeline/services/dayService';

export async function fetchDays() {
  const days = await getDays();
  // Plain JS-Objekte mit String-IDs zurückgeben
  return days.map((day: any) => ({
    ...day,
    _id: typeof day._id === 'string' ? day._id : (day._id?.toString?.() ?? ''),
  }));
} 