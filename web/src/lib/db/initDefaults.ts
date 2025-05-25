import { WorkingGroup } from './models/WorkingGroup';
import { Category } from './models/Category';

/**
 * Stellt sicher, dass die Default-Gruppe existiert.
 * Legt sie an, falls sie nicht vorhanden ist.
 */
export async function ensureDefaultWorkingGroup(): Promise<void> {
  const exists = await WorkingGroup.findOne({ name: 'default' }).lean();
  if (!exists) {
    await WorkingGroup.create({
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
      icon: 'Music',
      color: '#ff9900',
      description: 'Musik-Programm',
      isDefault: true,
    },
    {
      name: 'Essen',
      label: 'Essen',
      value: 'essen',
      icon: 'Utensils',
      color: '#ff9900',
      description: 'Essen & Trinken',
      isDefault: true,
    },
    {
      name: 'Spiele',
      label: 'Spiele',
      value: 'spiele',
      icon: 'Gamepad2',
      color: '#ff9900',
      description: 'Spiele & Aktionen',
      isDefault: true,
    },
    {
      name: 'Sonstiges',
      label: 'Sonstiges',
      value: 'other',
      icon: 'HelpCircle',
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