"use server";

import { updateEvent } from '@/features/timeline/services/eventService';
import { sendPushNotificationAction } from '@/features/push/actions/sendPushNotification';

/**
 * Moderation (Admin): Approve/Reject eines Events.
 * Rückgabetyp ist any | null, da .lean() kein echtes IEvent liefert.
 */
export async function moderateEvent(eventId: string, status: 'approved' | 'rejected', moderationComment?: string): Promise<any | null> {
  try {
    const updatedEvent = await updateEvent(eventId, { status, moderationComment });
    // Push-Benachrichtigung nur bei Freigabe
    if (status === 'approved' && updatedEvent?.title) {
      await sendPushNotificationAction({
        title: 'Neues Event veröffentlicht',
        body: updatedEvent.title,
        icon: '/icon-192x192.png',
        badge: '/badge-96x96.png',
        data: { type: 'timeline-event', eventId: updatedEvent._id }
      });
    }
    return updatedEvent;
  } catch (error) {
    console.error('Fehler beim Moderieren des Events:', error);
    throw new Error('Event konnte nicht moderiert werden.');
  }
} 