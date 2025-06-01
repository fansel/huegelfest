import { CentralFestivalDay } from '@/shared/services/festivalDaysService';

/**
 * Konvertiert zentrale Festival-Tage zu Legacy-Format für bestehende Komponenten
 */
export function convertToLegacyFormat(festivalDays: CentralFestivalDay[]): string[] {
  return festivalDays.map(day => {
    const date = new Date(day.date);
    const dayStr = date.getDate().toString().padStart(2, '0');
    const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dayStr}.${monthStr}.`;
  });
} 