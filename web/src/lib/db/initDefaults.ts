import { Group } from './models/Group';
import { Category } from './models/Category';

/**
 * Stellt sicher, dass die Default-Gruppe existiert.
 * Legt sie an, falls sie nicht vorhanden ist.
 */
export async function ensureDefaultGroup(): Promise<void> {
  const exists = await Group.findOne({ name: 'default' }).lean();
  if (!exists) {
    await Group.create({
      name: 'default',
      color: '#ff9900', // Standardfarbe, ggf. anpassen
    });
  }
}

/**
 * Stellt sicher, dass die wichtigsten Default-Kategorien existieren.
 * Legt sie an, falls sie nicht vorhanden sind.
 */
export async function ensureDefaultCategories(): Promise<void> {
  const defaultCategories = [
    {
      name: 'Musik',
      label: 'Musik',
      value: 'musik',
      icon: 'FaMusic',
      color: '#ff9900',
      description: 'Musik-Programm',
      isDefault: true,
    },
    {
      name: 'Essen',
      label: 'Essen',
      value: 'essen',
      icon: 'FaUtensils',
      color: '#ff9900',
      description: 'Essen & Trinken',
      isDefault: true,
    },
    {
      name: 'Spiele',
      label: 'Spiele',
      value: 'spiele',
      icon: 'FaGamepad',
      color: '#ff9900',
      description: 'Spiele & Aktionen',
      isDefault: true,
    },
    {
      name: 'Sonstiges',
      label: 'Sonstiges',
      value: 'other',
      icon: 'FaQuestion',
      color: '#ff9900',
      description: 'Sonstige Programmpunkte',
      isDefault: true,
    },
  ];

  for (const cat of defaultCategories) {
    const exists = await Category.findOne({ value: cat.value }).lean();
    if (!exists) {
      await Category.create(cat);
    }
  }
} 