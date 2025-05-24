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

// Utility-Funktion zum Bereinigen von Duplikaten
export const cleanupDuplicateFavorites = (): FavoriteItem[] => {
  const favorites = getFavorites();
  const seen = new Set<string>();
  const cleaned: FavoriteItem[] = [];

  favorites.forEach(fav => {
    // Primäre ID
    const primaryId = fav.id;
    // Composite ID für Vergleich
    const compositeId = (fav.data as any)?.compositeId;
    
    // Prüfe ob wir diese schon haben (per ID oder compositeId)
    const isDuplicate = seen.has(primaryId) || (compositeId && seen.has(compositeId));
    
    if (!isDuplicate) {
      cleaned.push(fav);
      seen.add(primaryId);
      if (compositeId) seen.add(compositeId);
    } else {
      console.log('Entferne doppelten Favorit:', primaryId, compositeId);
    }
  });

  // Bereinigte Liste speichern, falls sich was geändert hat
  if (cleaned.length !== favorites.length) {
    console.log(`Favoriten bereinigt: ${favorites.length} -> ${cleaned.length}`);
    saveFavorites(cleaned);
  }

  return cleaned;
}; 