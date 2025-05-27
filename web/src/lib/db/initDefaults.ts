import { WorkingGroup } from './models/WorkingGroup';
import { Category } from './models/Category';
import { Group } from './models/Group';

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
 * Stellt sicher, dass die Standard-Benutzergruppen existieren.
 * Legt sie an, falls sie nicht vorhanden sind.
 */
export async function ensureDefaultGroups(): Promise<void> {
  const defaultGroups = [
    { name: 'Fuchs', color: '#DC2626' }, // Rot
    { name: 'Wal', color: '#2563EB' }, // Blau
    { name: 'Frosch', color: '#16A34A' }, // Grün
    { name: 'Tiger', color: '#EA580C' }, // Orange
    { name: 'Schneehase', color: '#FFFFFF' }, // Weiß
    { name: 'Bär', color: '#92400E' }, // Braun
    { name: 'Flamingo', color: '#EC4899' }, // Rosa
    { name: 'Elefant', color: '#6B7280' }, // Grau
    { name: 'Giraffe', color: '#EAB308' }, // Gelb
    { name: 'Panther', color: '#000000' }, // Schwarz
    { name: 'Luchs', color: '#F59E0B' }, // Gold
    { name: 'Hai', color: '#9CA3AF' }, // Silber
    { name: 'Papagei', color: '#06B6D4' }, // Türkis
    { name: 'Kolibri', color: '#D946EF' }, // Magenta
    { name: 'Delfin', color: '#1E3A8A' }, // Dunkelblau
    { name: 'Chamäleon', color: '#84CC16' }, // Hellgrün
  ];

  for (const groupData of defaultGroups) {
    const exists = await Group.findOne({ name: groupData.name }).lean();
    if (!exists) {
      await Group.create({
        name: groupData.name,
        color: groupData.color,
        isAssignable: true,
        description: `Standard-Benutzergruppe ${groupData.name}`,
      });
    }
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