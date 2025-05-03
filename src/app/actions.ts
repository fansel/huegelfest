'use server'

import { headers } from 'next/headers'
import { webpush } from '@/server/lib/webpush'
import type { PushSubscription as WebPushSubscription } from 'web-push'

export async function subscribeUser(subscription: WebPushSubscription) {
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  await webpush.sendNotification(subscription, JSON.stringify({
    title: '',
    body: 'Willkommen beim Hügelfest!',
    icon: `${origin}/logo.jpg`,
    badge: `${origin}/logo.jpg`,
    data: {
      url: origin
    }
  }))
}

export async function unsubscribeUser() {
  // Hier können wir später die Subscription aus der Datenbank entfernen
} 