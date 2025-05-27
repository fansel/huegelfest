'use client';

import { useState, useCallback } from 'react';
import { 
  getAllFestivalDaysAction,
  createFestivalDayAction,
  updateFestivalDayAction,
  deleteFestivalDayAction,
  reorderFestivalDaysAction
} from '../actions/festivalDayActions';
import type { FestivalDay, CreateFestivalDayData, UpdateFestivalDayData } from '../types';

interface UseFestivalDaysReturn {
  // State
  days: FestivalDay[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadDays: () => Promise<void>;
  createDay: (data: CreateFestivalDayData) => Promise<FestivalDay | null>;
  updateDay: (id: string, data: UpdateFestivalDayData) => Promise<FestivalDay | null>;
  deleteDay: (id: string) => Promise<boolean>;
  reorderDays: (dayIds: string[]) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
}

export function useFestivalDays(): UseFestivalDaysReturn {
  const [days, setDays] = useState<FestivalDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadDays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getAllFestivalDaysAction();
      
      if (result.success && result.days) {
        setDays(result.days);
      } else {
        setError(result.error || 'Unbekannter Fehler beim Laden der Festival-Tage');
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Laden der Festival-Tage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDay = useCallback(async (data: CreateFestivalDayData): Promise<FestivalDay | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createFestivalDayAction(data);
      
      if (result.success && result.day) {
        setDays(prev => [...prev, result.day!].sort((a, b) => a.order - b.order));
        return result.day;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Erstellen des Festival-Tags');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Erstellen des Festival-Tags');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDay = useCallback(async (id: string, data: UpdateFestivalDayData): Promise<FestivalDay | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updateFestivalDayAction(id, data);
      
      if (result.success && result.day) {
        setDays(prev => prev.map(day => 
          day._id === id ? result.day! : day
        ).sort((a, b) => a.order - b.order));
        return result.day;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Aktualisieren des Festival-Tags');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Aktualisieren des Festival-Tags');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDay = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteFestivalDayAction(id);
      
      if (result.success) {
        setDays(prev => prev.filter(day => day._id !== id));
        return true;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Löschen des Festival-Tags');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Löschen des Festival-Tags');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reorderDays = useCallback(async (dayIds: string[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await reorderFestivalDaysAction(dayIds);
      
      if (result.success) {
        // Update local state to reflect new order
        const reorderedDays = dayIds.map((id, index) => {
          const day = days.find(d => d._id === id);
          return day ? { ...day, order: index + 1 } : null;
        }).filter(Boolean) as FestivalDay[];
        
        setDays(reorderedDays);
        return true;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Neuordnen der Festival-Tage');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Neuordnen der Festival-Tage');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  return {
    days,
    isLoading,
    error,
    loadDays,
    createDay,
    updateDay,
    deleteDay,
    reorderDays,
    clearError,
  };
} 