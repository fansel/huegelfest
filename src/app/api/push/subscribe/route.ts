import { NextResponse } from 'next/server'
import webpush from 'web-push'
import type { PushSubscription } from '../types'
import { connectDB } from '@/db/config/connector'
import { Subscriber } from '@/db/models/Subscriber'

// VAPID-Schlüssel aus den Umgebungsvariablen
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
    const subscription = await request.json();
    
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Ungültige Subscription-Daten' },
        { status: 400 }
      );
    }

    await connectDB();

    // Prüfe ob der Subscriber bereits existiert
    const existingSubscriber = await Subscriber.findOne({ endpoint: subscription.endpoint });
    if (existingSubscriber) {
      return NextResponse.json({ message: 'Bereits abonniert' });
    }

    // Erstelle neuen Subscriber
    await Subscriber.create({
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    return NextResponse.json({ message: 'Erfolgreich abonniert' });
  } catch (error) {
    console.error('Fehler beim Abonnieren:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 