"use server";

import { updateEvent } from '@/features/timeline/services/eventService';
import { createScheduledPushEvent } from '@/features/pushScheduler/scheduledPushEventService';
import { getCentralFestivalDayById } from '@/shared/services/festivalDaysService';
import { Event } from '@/lib/db/models/Event';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Moderation (Admin): Approve/Reject eines Events.
 * Now uses central festival days system instead of old Day model.
 */
export async function moderateEvent(eventId: string, status: 'approved' | 'rejected', moderationComment?: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[moderateEvent] Starting moderation for event:', eventId, 'Status:', status);
    
    // Lade aktuelles Event für agendaJobId
    const currentEvent = await Event.findById(eventId);
    console.log('[moderateEvent] Current event found:', !!currentEvent, 'Current status:', currentEvent?.status);
    
    const updatedEvent = await updateEvent(eventId, { status, moderationComment });
    console.log('[moderateEvent] Event updated:', !!updatedEvent);
    
    // Push-Benachrichtigung und scheduled Push nur bei Freigabe
    if (status === 'approved' && updatedEvent?.title) {
      console.log('[moderateEvent] Event approved, sending notifications');
      
      // Schedule immediate notification for the new event
      try {
        await createScheduledPushEvent({
          title: 'Neues Event veröffentlicht',
          body: updatedEvent.title,
          repeat: 'once',
          schedule: new Date(),
          active: true,
          sendToAll: true,
          type: 'general',
          data: { type: 'timeline-event', eventId: updatedEvent._id.toString() }
        });
        console.log('[moderateEvent] Immediate push notification scheduled');
      } catch (error) {
        console.error('[moderateEvent] Failed to schedule immediate push notification:', error);
      }

      // Scheduled Push für Event-Startzeit erstellen
      try {
        console.log('[moderateEvent] Creating scheduled push for approved event');
        await createScheduledPushForApprovedEvent(updatedEvent);
        console.log('[moderateEvent] Scheduled push creation completed');
      } catch (error) {
        console.error('[moderateEvent] Failed to create scheduled push:', error);
      }
    } else if (status === 'rejected' && currentEvent?.agendaJobId) {
      console.log('[moderateEvent] Event rejected, cancelling agenda job:', currentEvent.agendaJobId);
      // Bei Ablehnung scheduled Push löschen falls vorhanden
      await cancelScheduledPushForEvent(currentEvent.agendaJobId);
    } else {
      console.log('[moderateEvent] No special actions needed for status:', status);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Moderieren des Events:', error);
    return { success: false, error: 'Event konnte nicht moderiert werden.' };
  }
}

/**
 * Erstellt einen scheduled Push für ein gerade approved Event
 * Now uses central festival days system
 */
async function createScheduledPushForApprovedEvent(event: any) {
  try {
    console.log('[createScheduledPushForApprovedEvent] Starting for event:', event._id, 'Title:', event.title);
    
    // Hole das Datum des Tages aus dem zentralen Festival Days System
    const day = await getCentralFestivalDayById(event.dayId);
    if (!day) {
      console.log('[createScheduledPushForApprovedEvent] No day found for dayId:', event.dayId);
      return;
    }
    
    console.log('[createScheduledPushForApprovedEvent] Day found:', day.label, 'Date:', day.date);
    
    // 1. UTC-Datum aus DB holen
    const utcDate = day.date;
    // 2. In lokale Zeit (Europe/Berlin) umwandeln
    const berlinDate = toZonedTime(utcDate, 'Europe/Berlin');
    // 3. Lokales Datum als String im Format 'yyyy-MM-dd'
    const datePart = format(berlinDate, 'yyyy-MM-dd');
    // 4. Mit Uhrzeit kombinieren
    const localDateTime = `${datePart}T${event.time}:00`;
    // 5. Wieder in UTC umwandeln
    const eventDate = fromZonedTime(localDateTime, 'Europe/Berlin');

    console.log('[createScheduledPushForApprovedEvent] Calculated event date:', eventDate);
    console.log('[createScheduledPushForApprovedEvent] Current date:', new Date());
    console.log('[createScheduledPushForApprovedEvent] Event is in future:', eventDate > new Date());

    // Nur scheduled Push erstellen wenn Event in der Zukunft liegt
    if (eventDate > new Date()) {
      console.log('[createScheduledPushForApprovedEvent] Creating scheduled push event');
      
      // Erstelle den Push-Event
      const pushEvent = await createScheduledPushEvent({
        title: event.title,
        body: `Programmpunkt "${event.title}" startet jetzt!`,
        repeat: 'once',
        schedule: eventDate,
        active: true,
        sendToAll: true,
        type: 'general'
      });
      
      console.log('[createScheduledPushForApprovedEvent] Push event created with agendaJobId:', pushEvent.agendaJobId);

      // Speichere pushEvent ID im Event für späteren Zugriff
      if (pushEvent.agendaJobId) {
        await Event.findByIdAndUpdate(event._id, { agendaJobId: pushEvent.agendaJobId });
        console.log('[createScheduledPushForApprovedEvent] Event updated with agendaJobId');
      }
    } else {
      console.log('[createScheduledPushForApprovedEvent] Event is in the past, skipping scheduled push');
    }
  } catch (error) {
    console.error('Fehler beim Erstellen des scheduled Push für approved Event:', error);
    // Don't throw - approval should still succeed even if push scheduling fails
  }
}

/**
 * Löscht einen scheduled Push Job
 */
async function cancelScheduledPushForEvent(agendaJobId: string) {
  if (!agendaJobId) return;
  try {
    const { getAgendaClient } = await import('@/lib/pushScheduler/agenda');
    const agenda = await getAgendaClient();
    await agenda.cancel({ _id: agendaJobId });
    console.log('[cancelScheduledPushForEvent] Successfully cancelled agenda job:', agendaJobId);
  } catch (error) {
    console.error('Fehler beim Löschen des scheduled Push:', error);
  }
} 