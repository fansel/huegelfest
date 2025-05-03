import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { connectDB } from '@/database/config/connector'
import { Subscriber } from '@/database/models/Subscriber'

// VAPID-Schlüssel
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID-Schlüssel fehlen in den Umgebungsvariablen');
}

webpush.setVapidDetails(
  'mailto:vapid@hey.fansel.dev',
  vapidPublicKey,
  vapidPrivateKey
)

export async function POST(request: Request) {
  try {
    const { message, type } = await request.json()
    
    await connectDB()
    const subscribers = await Subscriber.find()
    
    if (subscribers.length === 0) {
      console.log('Keine aktiven Subscriber gefunden')
      return NextResponse.json({ success: true })
    }
    
    // Erstelle die Payload für die Push-Benachrichtigung
    const notificationPayload = {
      title: type || 'Neue Benachrichtigung',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-96x96.png',
      data: {
        url: '/',
        type: type
      }
    }
    
    // Sende die Push-Benachrichtigung an alle Subscriber
    for (const subscriber of subscribers) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscriber.endpoint,
            keys: subscriber.keys
          },
          JSON.stringify(notificationPayload)
        )
      } catch (error) {
        console.error('Fehler beim Senden der Benachrichtigung:', error)
        // Wenn der Subscriber nicht mehr gültig ist, entferne ihn
        if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
          await Subscriber.deleteOne({ _id: subscriber._id })
        }
      }
    }
    
    console.log('Benachrichtigungen erfolgreich gesendet')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Senden der Benachrichtigungen:', error)
    return NextResponse.json(
      { success: false, error: 'Fehler beim Senden der Benachrichtigungen' },
      { status: 500 }
    )
  }
} 