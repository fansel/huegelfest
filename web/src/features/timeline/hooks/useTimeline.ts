import { useState, useCallback } from 'react';
import type { TimelineData, Day, Event } from '../types/types';
import { fetchTimeline } from '../actions/fetchTimeline';
import { createDay } from '../actions/createDay';
import { removeDay } from '../actions/removeDay';
import { createEvent } from '../actions/createEvent';
import { removeEvent } from '../actions/removeEvent';
import { moveEvent } from '../actions/moveEvent';
import { updateEvent } from '../actions/updateEvent';
import { updateDay } from '../actions/updateDay';
import type { TimelineServiceError } from '../services/timelineService';
import { getCategoriesAction } from '@/features/categories/actions/getCategories';
import type { Category } from '../types/types';
import React from 'react';

/**
 * Type Guard für TimelineServiceError
 */
function isTimelineServiceError(obj: unknown): obj is TimelineServiceError {
  return typeof obj === 'object' && obj !== null && 'error' in obj;
}

/**
 * React-Hook für die zentrale Timeline-Logik
 *
 * @returns Timeline-Daten, Lade-/Fehlerstatus und alle Mutations als Methoden
 */
export function useTimeline() {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  /**
   * Lädt die Timeline-Daten neu
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTimeline();
    console.log('[useTimeline] fetchTimeline result:', result);
    if (isTimelineServiceError(result)) {
      setError(result.error ? String(result.error) : 'Unbekannter Fehler');
      setTimeline(null);
    } else {
      setTimeline(result as TimelineData);
    }
    setLoading(false);
  }, []);

  /**
   * Fügt einen Tag hinzu
   */
  const handleCreateDay = useCallback(async (day: Day) => {
    setLoading(true);
    setError(null);
    const result = await createDay(day);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Löscht einen Tag
   */
  const handleRemoveDay = useCallback(async (dayId: string) => {
    setLoading(true);
    setError(null);
    const result = await removeDay(dayId);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Fügt einem Tag ein Event hinzu
   */
  const handleCreateEvent = useCallback(async (dayId: string, event: Event) => {
    setLoading(true);
    setError(null);
    const result = await createEvent(dayId, event);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Löscht ein Event aus einem Tag
   */
  const handleRemoveEvent = useCallback(async (dayId: string, eventId: string) => {
    setLoading(true);
    setError(null);
    const result = await removeEvent(dayId, eventId);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Verschiebt ein Event zu einem anderen Tag
   */
  const handleMoveEvent = useCallback(async (fromDayId: string, toDayId: string, eventId: string) => {
    setLoading(true);
    setError(null);
    const result = await moveEvent(fromDayId, toDayId, eventId);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Bearbeitet ein Event in einem Tag
   */
  const handleUpdateEvent = useCallback(async (dayId: string, event: Event) => {
    setLoading(true);
    setError(null);
    const result = await updateEvent(dayId, event);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  /**
   * Bearbeitet einen Tag
   */
  const handleUpdateDay = useCallback(async (dayId: string, day: Day) => {
    setLoading(true);
    setError(null);
    const result = await updateDay(dayId, day);
    if (isTimelineServiceError(result)) {
      setError(result.error);
    } else {
      await refetch();
    }
    setLoading(false);
  }, [refetch]);

  // Kategorien laden
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const result = await getCategoriesAction();
      setCategories(
        (result as any[]).map((cat) => ({
          ...cat,
          _id: typeof cat._id === 'string' ? cat._id : (cat._id?.toString?.() ?? ''),
        }))
      );
    } catch (err: any) {
      setCategoriesError(err?.message || 'Fehler beim Laden der Kategorien');
    }
    setCategoriesLoading(false);
  }, []);

  // Kategorien beim Mounten laden
  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Timeline initial laden
  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    timeline,
    loading,
    error,
    refetch,
    createDay: handleCreateDay,
    removeDay: handleRemoveDay,
    updateDay: handleUpdateDay,
    createEvent: handleCreateEvent,
    removeEvent: handleRemoveEvent,
    moveEvent: handleMoveEvent,
    updateEvent: handleUpdateEvent,
    categories,
    categoriesLoading,
    categoriesError,
    fetchCategories,
  };
} 