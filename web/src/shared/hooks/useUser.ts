"use client";

import { useState, useEffect } from 'react';
import { useDeviceId } from './useDeviceId';
import { 
  findOrCreateUserAction, 
  getUserStatsAction,
  updateUserPreferencesAction 
} from '@/features/auth/actions/userActions';

export interface UserData {
  userId: string;
  name: string;
  stats: {
    announcementReactions: number;
    favoritesCount: number;
    lastActivity: Date;
  };
  preferences: {
    notifications: boolean;
    favoriteCategories: string[];
    theme: 'light' | 'dark' | 'system';
  };
  hasRegistration: boolean;
  createdAt: Date;
}

export interface UseUserReturn {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  createUser: (name: string) => Promise<boolean>;
  updatePreferences: (preferences: Partial<UserData['preferences']>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

/**
 * Hook für das passwortlose User-System basierend auf DeviceID
 */
export function useUser(): UseUserReturn {
  const deviceId = useDeviceId();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lade User-Daten bei Device-ID-Änderung
  useEffect(() => {
    if (deviceId) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, [deviceId]);

  const loadUser = async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    try {
      const userData = await getUserStatsAction(deviceId);
      setUser(userData);
    } catch (error) {
      console.error('[useUser] Fehler beim Laden der User-Daten:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (name: string): Promise<boolean> => {
    if (!deviceId || !name.trim()) return false;
    
    try {
      const result = await findOrCreateUserAction(deviceId, name.trim());
      if (result?.user) {
        await loadUser(); // Lade User-Daten neu
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useUser] Fehler beim Erstellen des Users:', error);
      return false;
    }
  };

  const updatePreferences = async (preferences: Partial<UserData['preferences']>): Promise<boolean> => {
    if (!deviceId) return false;
    
    try {
      const result = await updateUserPreferencesAction(deviceId, preferences);
      if (result.success) {
        await loadUser(); // Lade User-Daten neu
        return true;
      }
      return false;
    } catch (error) {
      console.error('[useUser] Fehler beim Aktualisieren der Preferences:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    createUser,
    updatePreferences,
    refreshUser
  };
} 