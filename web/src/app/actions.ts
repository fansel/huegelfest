'use server'

import { revalidatePath } from 'next/cache'
import { webPushService } from '@/server/lib/lazyServices'
import type { PushSubscription as WebPushSubscription } from 'web-push'

export async function sendPushNotification(title: string, body: string, icon?: string, badge?: string, data?: Record<string, any>) {
  try {
    const service = await webPushService.getInstance()
    if (!service.isInitialized()) {
      console.warn('Push-Benachrichtigungen sind nicht verfügbar')
      return
    }

    await service.sendNotificationToAll({
      title,
      body,
      icon,
      badge,
      data
    })
  } catch (error) {
    console.error('Fehler beim Senden der Push-Benachrichtigung:', error)
  }
}

export async function subscribeToPushNotifications(subscription: WebPushSubscription, deviceId: string) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceId
      }),
    })

    if (!response.ok) {
      throw new Error('Fehler beim Abonnieren der Push-Benachrichtigungen')
    }

    return await response.json()
  } catch (error) {
    console.error('Fehler beim Abonnieren der Push-Benachrichtigungen:', error)
    throw error
  }
}

export async function subscribeUser(subscription: WebPushSubscription) {
  try {
    const service = await webPushService.getInstance()
    if (!service.isInitialized()) {
      console.warn('Push-Benachrichtigungen sind nicht verfügbar')
      return false
    }

    // Teste die Subscription mit einer Test-Benachrichtigung
    await service.sendNotificationToAll({
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