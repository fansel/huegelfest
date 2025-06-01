import { format, isToday, parseISO, addHours } from 'date-fns';
import { de } from 'date-fns/locale';
import type { ActivityTimeStatus, ActivityWithCategoryAndTemplate } from '../types';

/**
 * Berechnet den aktuellen Status einer Aktivität basierend auf Zeit
 */
export function getActivityTimeStatus(activity: ActivityWithCategoryAndTemplate): ActivityTimeStatus {
  const now = new Date();
  const activityDate = parseISO(activity.date);
  
  // Wenn keine Startzeit angegeben ist, kann die Aktivität nicht aktiv sein
  if (!activity.startTime) {
    return {
      isActive: false,
      hasStarted: false,
      hasEnded: false,
      canSendReminder: false,
    };
  }

  // Parse start time
  const [startHour, startMin] = activity.startTime.split(':').map(Number);
  const startDateTime = new Date(activityDate);
  startDateTime.setHours(startHour, startMin, 0, 0);

  // Parse end time or default to 1 hour after start
  let endDateTime: Date;
  if (activity.endTime) {
    const [endHour, endMin] = activity.endTime.split(':').map(Number);
    endDateTime = new Date(activityDate);
    endDateTime.setHours(endHour, endMin, 0, 0);
  } else {
    endDateTime = addHours(startDateTime, 1);
  }

  const hasStarted = now >= startDateTime;
  const hasEnded = now >= endDateTime;
  const isActive = hasStarted && !hasEnded;

  return {
    isActive,
    hasStarted,
    hasEnded,
    canSendReminder: hasStarted,
    timeRemaining: isActive ? getTimeRemaining(now, endDateTime) : undefined,
  };
}

/**
 * Berechnet die verbleibende Zeit bis zum Ende einer Aktivität
 */
function getTimeRemaining(now: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Endet gleich';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} Min verbleibend`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m verbleibend`;
  }
}

/**
 * Formatiert die Zeitanzeige für eine Aktivität
 */
export function formatActivityTime(activity: ActivityWithCategoryAndTemplate): string {
  if (!activity.startTime) {
    return 'Ganztägig';
  }

  if (activity.endTime) {
    return `${activity.startTime} - ${activity.endTime}`;
  }

  return activity.startTime;
}

/**
 * Prüft ob eine Aktivität heute stattfindet
 */
export function isActivityToday(activity: ActivityWithCategoryAndTemplate): boolean {
  return isToday(parseISO(activity.date));
}

/**
 * Erstellt ein DateTime-Objekt für eine Aktivität
 */
export function getActivityDateTime(activity: ActivityWithCategoryAndTemplate, useEndTime = false): Date | null {
  if (!activity.startTime) return null;

  const activityDate = parseISO(activity.date);
  const timeString = useEndTime && activity.endTime ? activity.endTime : activity.startTime;
  const [hour, min] = timeString.split(':').map(Number);
  
  const dateTime = new Date(activityDate);
  dateTime.setHours(hour, min, 0, 0);
  
  return dateTime;
}

/**
 * Sortiert Aktivitäten nach Zeit
 */
export function sortActivitiesByTime(activities: ActivityWithCategoryAndTemplate[]): ActivityWithCategoryAndTemplate[] {
  return activities.sort((a, b) => {
    // Aktivitäten ohne Zeit kommen ans Ende
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;

    // Vergleiche Startzeiten
    const timeA = a.startTime;
    const timeB = b.startTime;
    
    return timeA.localeCompare(timeB);
  });
}

/**
 * Gruppiert Aktivitäten nach ihrem Status
 */
export function groupActivitiesByStatus(activities: ActivityWithCategoryAndTemplate[]) {
  const active: ActivityWithCategoryAndTemplate[] = [];
  const upcoming: ActivityWithCategoryAndTemplate[] = [];
  const past: ActivityWithCategoryAndTemplate[] = [];

  activities.forEach(activity => {
    const status = getActivityTimeStatus(activity);
    
    if (status.isActive) {
      active.push(activity);
    } else if (status.hasEnded) {
      past.push(activity);
    } else {
      upcoming.push(activity);
    }
  });

  return {
    active: sortActivitiesByTime(active),
    upcoming: sortActivitiesByTime(upcoming),
    past: sortActivitiesByTime(past),
  };
}

/**
 * Prüft ob eine Aktivität in den nächsten X Minuten beginnt
 */
export function isActivityStartingSoon(activity: ActivityWithCategoryAndTemplate, minutesAhead = 15): boolean {
  const startDateTime = getActivityDateTime(activity);
  if (!startDateTime) return false;

  const now = new Date();
  const diffMs = startDateTime.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= minutesAhead;
} 