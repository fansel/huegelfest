'use server'

import { revalidatePath } from 'next/cache'
import { webPushService } from '@/server/lib/webpush'
import { logger } from '@/server/lib/logger'
import type { PushSubscription as WebPushSubscription } from 'web-push'

export async function sendNotification(title: string, body: string) {
  try {
    // WebPush Service initialisieren
    webPushService.initialize()
    
    await webPushService.sendNotificationToAll({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        timestamp: new Date().toISOString()
      }
    })
    
    logger.info('[Actions] Benachrichtigung erfolgreich gesendet', { title })
  } catch (error) {
    logger.error('[Actions] Fehler beim Senden der Benachrichtigung:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    })
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
    logger.error('[Actions] Fehler beim Abonnieren der Push-Benachrichtigungen:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function subscribeUser(subscription: WebPushSubscription) {
  try {
    webPushService.initialize()
    if (!webPushService.isInitialized()) {
      logger.warn('[Actions] Push-Benachrichtigungen sind nicht verfügbar')
      return false
    }

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
    logger.error('[Actions] Fehler beim Testen der Subscription:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

export async function unsubscribeUser() {
  // Hier können wir später die Subscription aus der Datenbank entfernen
} 