import { useState, useEffect, useCallback } from 'react';
import { FavoriteItem } from '../types/favorites';
import { getFavorites, saveFavorites } from '../services/favoritesStorage';

interface UseFavoritesResult {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavorites = (): UseFavoritesResult => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const addFavorite = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === item.id)) return prev;
      const updated = [...prev, item];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((item) => item.id === id);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}; 