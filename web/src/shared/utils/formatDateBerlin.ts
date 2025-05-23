/**
 * Formatiert ein Datum immer in der Zeitzone Europe/Berlin (CEST/CET).
 * @param date - Das zu formatierende Datum (ISO-String oder Date-Objekt)
 * @param options - Optionale Formatierungsoptionen für Intl.DateTimeFormat
 * @returns Das formatierte Datum als String
 */
export function formatDateBerlin(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    ...options,
  });
} 