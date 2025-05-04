export const runtime = 'nodejs';

import { NextResponse } from 'next/server'
import { connectDB } from '@/database/config/apiConnector'
import { Subscriber } from '@/database/models/Subscriber'
import { webPushService } from '@/server/lib/lazyServices'
import { logger } from '@/server/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys, deviceId } = body;

    logger.info('[Push Subscribe] Neue Subscription-Anfrage', { deviceId, endpoint: endpoint.substring(0, 50) + '...' });

    if (!endpoint || !keys || !deviceId) {
      logger.warn('[Push Subscribe] Fehlende Pflichtfelder', { endpoint: !!endpoint, keys: !!keys, deviceId: !!deviceId });
      return NextResponse.json(
        { error: 'Erforderliche Felder fehlen' },
        { status: 400 }
      );
    }

    await connectDB();
    logger.info('[Push Subscribe] DB-Verbindung hergestellt');

    // Prüfe ob bereits ein Abonnement für diese Device-ID existiert
    const existingSubscription = await Subscriber.findOne({ deviceId });
    if (existingSubscription) {
      logger.info('[Push Subscribe] Bestehende Subscription gefunden, aktualisiere', { deviceId });
      // Aktualisiere das bestehende Abonnement
      existingSubscription.endpoint = endpoint;
      existingSubscription.keys = keys;
      await existingSubscription.save();
      logger.info('[Push Subscribe] Subscription erfolgreich aktualisiert', { deviceId });
      return NextResponse.json({ message: 'Abonnement aktualisiert' });
    }

    // Erstelle neues Abonnement
    logger.info('[Push Subscribe] Erstelle neue Subscription', { deviceId });
    await Subscriber.create({
      endpoint,
      keys,
      deviceId,
      createdAt: new Date()
    });
    logger.info('[Push Subscribe] Neue Subscription erfolgreich erstellt', { deviceId });

    return NextResponse.json({ message: 'Abonnement erfolgreich erstellt' });
  } catch (error) {
    logger.error('[Push Subscribe] Fehler beim Erstellen des Push-Abonnements:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 