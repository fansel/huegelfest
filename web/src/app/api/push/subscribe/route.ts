import { NextResponse } from 'next/server'
import { connectDB } from '@/database/config/apiConnector'
import { Subscriber } from '@/database/models/Subscriber'
import { webPushService } from '@/server/lib/lazyServices'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys, deviceId } = body;

    if (!endpoint || !keys || !deviceId) {
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
      );
    }

    await connectDB();

    // Prüfe ob bereits ein Abonnement für diese Device-ID existiert
    const existingSubscription = await Subscriber.findOne({ deviceId });
    if (existingSubscription) {
      // Aktualisiere das bestehende Abonnement
      existingSubscription.endpoint = endpoint;
      existingSubscription.keys = keys;
      await existingSubscription.save();
      return NextResponse.json({ message: 'Abonnement aktualisiert' });
    }

    // Erstelle neues Abonnement
    await Subscriber.create({
      endpoint,
      keys,
      deviceId,
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Abonnement erfolgreich erstellt' });
  } catch (error) {
    console.error('Fehler beim Erstellen des Push-Abonnements:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 