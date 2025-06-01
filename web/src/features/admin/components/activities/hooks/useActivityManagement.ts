'use client';

import { useState, useCallback } from 'react';
import { createActivityAction } from '../actions/createActivity';
import { updateActivityAction } from '../actions/updateActivity';
import { deleteActivityAction } from '../actions/deleteActivity';
import { sendActivityReminderAction } from '../actions/sendActivityReminder';
import type { CreateActivityData, UpdateActivityData, Activity } from '../types';

interface UseActivityManagementReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createActivity: (data: CreateActivityData, createdBy: string) => Promise<Activity | null>;
  updateActivity: (id: string, data: UpdateActivityData) => Promise<Activity | null>;
  deleteActivity: (id: string) => Promise<boolean>;
  sendReminder: (activityId: string) => Promise<{ success: boolean; sent?: number; message?: string }>;
  
  // Utilities
  clearError: () => void;
}

export function useActivityManagement(): UseActivityManagementReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createActivity = useCallback(async (data: CreateActivityData, createdBy: string): Promise<Activity | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await createActivityAction(data, createdBy);
      
      if (result.success && result.activity) {
        return result.activity;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Erstellen der Aktivität');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Erstellen der Aktivität');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateActivity = useCallback(async (id: string, data: UpdateActivityData): Promise<Activity | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await updateActivityAction(id, data);
      
      if (result.success && result.activity) {
        return result.activity;
      } else {
        setError(result.error || 'Unbekannter Fehler beim Aktualisieren der Aktivität');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Aktualisieren der Aktivität');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await deleteActivityAction(id);
      
      if (result.success) {
        return true;
      } else {
        setError((result as any).error || 'Unbekannter Fehler beim Löschen der Aktivität');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Löschen der Aktivität');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendReminder = useCallback(async (activityId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sendActivityReminderAction(activityId);
      
      if (result.success) {
        return {
          success: true,
          sent: result.sent,
          message: result.message,
        };
      } else {
        setError(result.error || 'Unbekannter Fehler beim Senden der Erinnerung');
        return { success: false };
      }
    } catch (err: any) {
      setError(err.message || 'Unbekannter Fehler beim Senden der Erinnerung');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    sendReminder,
    clearError,
  };
} 