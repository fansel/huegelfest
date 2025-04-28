import { NextResponse } from 'next/server'
import webpush from 'web-push'
import type { PushSubscription } from 'web-push'
import { readFile } from 'fs/promises'
import { join } from 'path'

// VAPID-Schlüssel
const NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BGaY-2eeg8pi2yNRIsLdm4SN4RmHTKdVwaeEdZeUpJSMv9isl12K0TadiH9GDDWo96r7OFFMPdurXoSEiu0nnH4'
const VAPID_PRIVATE_KEY = '19N-DzH4SjTHGvhapCSm3o61V0iGaqJu6zGWvJ5zrsI'

const DATA_DIR = join(process.cwd(), 'src/data')
const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscribers.json')

webpush.setVapidDetails(
  'mailto:info@huegelfest.de',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

export async function POST(request: Request) {
  try {
    const { message, type } = await request.json()
    
    // Lese die Subscriptions aus der Datei
    const subscriptionsData = await readFile(SUBSCRIPTIONS_FILE, 'utf-8')
    const { subscriptions } = JSON.parse(subscriptionsData)
    
    if (subscriptions.length === 0) {
      console.log('Keine aktiven Subscriptions gefunden')
      return NextResponse.json({ success: true })
    }
    
    // Erstelle die Payload für die Push-Benachrichtigung
    const notificationPayload = {
      title: '',
      body: message,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      data: {
        url: '/',
        type: type
      }
    }
    
    // Sende die Push-Benachrichtigung an alle Subscriptions
    const promises = subscriptions.map(async (subscription: PushSubscription) => {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
      } catch (error) {
        console.error('Fehler beim Senden der Benachrichtigung:', error)
      }
    })
    
    await Promise.all(promises)
    console.log('Benachrichtigungen erfolgreich gesendet')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Senden der Benachrichtigungen:', error)
    return NextResponse.json({ success: false, error: 'Fehler beim Senden der Benachrichtigungen' }, { status: 500 })
  }
} 