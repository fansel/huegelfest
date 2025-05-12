import { FavoriteItem } from '../types/favorites';

const FAVORITES_KEY = 'favorites';

export const getFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Fehler beim Parsen der Favoriten aus dem Storage:', e);
    localStorage.removeItem(FAVORITES_KEY); // Storage zurücksetzen, falls defekt
    return [];
  }
};

export const saveFavorites = (favorites: FavoriteItem[]): void => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}; 