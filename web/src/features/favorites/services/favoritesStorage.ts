import { FavoriteItem } from '../types/favorites';

const FAVORITES_KEY = 'favorites';

export const getFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveFavorites = (favorites: FavoriteItem[]): void => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}; 