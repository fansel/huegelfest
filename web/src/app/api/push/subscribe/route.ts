import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/database/config/connector'
import { Subscriber } from '@/database/models/Subscriber'
import { webPushService } from '@/server/lib/webpush'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, deviceId } = body;

    if (!subscription || !deviceId) {
      return NextResponse.json(
        { error: 'Subscription und deviceId sind erforderlich' },
        { status: 400 }
      );
    }

    await connectDB();

    // Prüfe ob der Subscriber bereits existiert
    const existingSubscriber = await Subscriber.findOne({ deviceId });
    
    if (existingSubscriber) {
      // Aktualisiere die Subscription
      existingSubscriber.endpoint = subscription.endpoint;
      existingSubscriber.keys = subscription.keys;
      await existingSubscriber.save();
      return NextResponse.json({ message: 'Subscription aktualisiert' });
    }

    // Erstelle neuen Subscriber
    await Subscriber.create({
      deviceId,
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    return NextResponse.json({ message: 'Subscription erfolgreich' });
  } catch (error) {
    console.error('Fehler bei der Push-Subscription:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 