'use client';
import { useState, useEffect, useCallback } from 'react';
import { FavoriteItem } from '../types/favorites';
import { getFavorites, saveFavorites, cleanupDuplicateFavorites } from '../services/favoritesStorage';
import useSWR from 'swr';
import { fetchTimeline } from '@/features/timeline/actions/fetchTimeline';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

interface UseFavoritesResult {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  // Timeline-Daten für FavoritesList
  timelineData: any;
  isLoading: boolean;
  isOnline: boolean;
}

export const useFavorites = (): UseFavoritesResult => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const { isOnline } = useNetworkStatus();

  // SWR für Timeline-Daten (konsistent mit TimelineClient)
  const { data: timelineData, isLoading, mutate } = useSWR(
    'timeline',
    isOnline ? fetchTimeline : null, // Nur online fetchen
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryInterval: isOnline ? 5000 : 30000,
      shouldRetryOnError: isOnline,
      dedupingInterval: 30000,
    }
  );

  // WebSocket für Timeline-Updates - FavoritesList braucht aktuelle Timeline-Daten!
  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      // FavoritesList zeigt Timeline-Daten an, deshalb müssen wir bei Updates revalidieren
      if (msg.topic?.includes('day-') || msg.topic?.includes('event-') || msg.topic?.includes('category-')) {
        console.log('[useFavorites] Timeline-Update empfangen, revalidiere Timeline-Daten:', msg.topic);
        if (isOnline) {
          mutate(); // Timeline-Daten neu laden für aktuelle Anzeige in FavoritesList
        }
      }
    },
    topicFilter: ['day-*', 'event-*', 'category-*'] // Wildcard-Filter für Timeline-bezogene Events
  });

  // Favoriten aus localStorage laden und dabei bereinigen
  useEffect(() => {
    const cleaned = cleanupDuplicateFavorites();
    setFavorites(Array.isArray(cleaned) ? cleaned : []);
  }, []);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      // Duplikate vermeiden - prüfe sowohl ID als auch compositeId
      const isDuplicate = prev.some((fav) => {
        // Direkte ID-Übereinstimmung
        if (fav.id === item.id) return true;
        
        // Prüfe auch auf compositeId-Übereinstimmung für Legacy-Support
        const favCompositeId = (fav.data as any)?.compositeId;
        const itemCompositeId = (item.data as any)?.compositeId;
        if (favCompositeId && itemCompositeId && favCompositeId === itemCompositeId) return true;
        
        return false;
      });
      
      if (isDuplicate) return prev;
      
      const updated = [...prev, item];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      // Entferne nach ID oder compositeId für Legacy-Support
      const updated = prev.filter((item) => {
        // Direkte ID-Übereinstimmung
        if (item.id === id) return false;
        
        // Prüfe auch compositeId für Events mit geänderten Titeln
        const compositeId = (item.data as any)?.compositeId;
        if (compositeId === id) return false;
        
        return true;
      });
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback((id: string | undefined) => {
    if (!id) return false;
    
    return favorites.some((item) => {
      // Direkte ID-Übereinstimmung
      if (item.id === id) return true;
      
      // Prüfe auch compositeId für Legacy-Favoriten
      const compositeId = (item.data as any)?.compositeId;
      if (compositeId === id) return true;
      
      // Zusätzliche Prüfung: Wenn die eingehende ID eine compositeId ist, 
      // prüfe ob wir ein Event mit passenden Eigenschaften haben
      if (id.includes('-') && timelineData) {
        const [dayTitle, time, title] = id.split('-');
        return favorites.some(fav => {
          const favData = fav.data as any;
          return favData?.dayTitle === dayTitle && 
                 favData?.time === time && 
                 favData?.title === title;
        });
      }
      
      return false;
    });
  }, [favorites, timelineData]);

  return { 
    favorites, 
    addFavorite, 
    removeFavorite, 
    isFavorite,
    timelineData,
    isLoading,
    isOnline 
  };
};