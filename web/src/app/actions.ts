'use server'

import { headers } from 'next/headers'
import { webPushService } from '@/server/lib/webpush'
import type { PushSubscription as WebPushSubscription } from 'web-push'

export async function subscribeUser(subscription: WebPushSubscription) {
  try {
    // Teste die Subscription mit einer Test-Benachrichtigung
    await webPushService.sendNotificationToAll({
      title: 'Test-Benachrichtigung',
      body: 'Push-Benachrichtigungen sind jetzt aktiviert!',
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        url: '/'
      }
    });
    return true;
  } catch (error) {
    console.error('Fehler beim Testen der Subscription:', error);
    return false;
  }
}

export async function unsubscribeUser() {
  // Hier können wir später die Subscription aus der Datenbank entfernen
} 