export interface FavoriteItem {
  id: string;
  type: 'timeline' | 'group' | 'announcement'; // Erweiterbar für weitere Entitäten
  data?: Record<string, unknown>; // Optionale Zusatzinfos
} 