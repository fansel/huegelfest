import type { ICategory } from '../models/Category';
import { Category } from '../models/Category';
import { logger } from '@/server/lib/logger';

export const defaultCategories: ICategory[] = [
  {
    name: 'Musik',
    label: 'Musik',
    value: 'music',
    icon: 'FaMusic',
    color: '#FF6B6B',
    description: 'Musikalische Darbietungen und Konzerte'
  },
  {
    name: 'Essen & Trinken',
    label: 'Essen & Trinken',
    value: 'food',
    icon: 'FaUtensils',
    color: '#4ECDC4',
    description: 'Kulinarische Angebote und Getränke'
  },
  {
    name: 'Aktivitäten',
    label: 'Aktivitäten',
    value: 'activities',
    icon: 'FaGamepad',
    color: '#45B7D1',
    description: 'Verschiedene Aktivitäten und Spiele'
  },
  {
    name: 'Sonstiges',
    label: 'Sonstiges',
    value: 'other',
    icon: 'FaQuestion',
    color: '#96CEB4',
    description: 'Weitere Veranstaltungen und Angebote'
  }
];

export async function initializeDefaultCategories() {
  try {
    // Prüfe, ob bereits Kategorien existieren
    const existingCategories = await Category.find().exec();
    if (existingCategories.length > 0) {
      logger.info('Kategorien existieren bereits, überspringe Initialisierung');
      return;
    }

    // Erstelle Standard-Kategorien
    await Category.insertMany(defaultCategories);
    logger.info('Standard-Kategorien erfolgreich erstellt');
  } catch (error) {
    logger.error('Fehler beim Erstellen der Standard-Kategorien:', error);
    throw error;
  }
} 