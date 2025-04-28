'use server'

import { headers } from 'next/headers'
import { webpush } from '@/lib/webpush'

export async function subscribeUser(subscription: PushSubscription) {
  const headersList = headers()
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

export async function sendNotification(message: string) {
  // Hier können wir später die Notification an alle Subscriber senden
} 