import { WorkingGroup } from './models/WorkingGroup';
import { Category } from './models/Category';
import { Group } from './models/Group';
import { FestivalDay } from './models/FestivalDay';
import { logger } from '../logger';

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
    },
    {
     
      name: 'Awareness',
      color: '#DC2626', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Infrastruktur',
      color: '#2563EB', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Küche',
      color: '#16A34A', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Technik',
      color: '#3B82F6', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Finanzen',
      color: '#F59E0B', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Programm',
      color: '#EAB308', // Standardfarbe, ggf. anpassen
    },
    {
      name: 'Allgemein',
      color: '#F59E0B', // Standardfarbe, ggf. anpassen
    },
    
    

  
  
  );
  
    logger.info('[Init] Default-Gruppe erfolgreich erstellt.');
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
    { name: 'Igel', color: '#008000' }, // Dunkelgrün
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
      name: 'Workshops',
      label: 'Workshops',
      value: 'workshops',
      icon: 'Wrench',
      color: '#ff9900',
      description: 'Workshops & Aktionen',
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


// Festival-Tage werden jetzt über die zentrale Verwaltung initialisiert
// Siehe: /shared/services/festivalDaysService.ts -> initDefaultFestivalDaysIfEmpty()




    
