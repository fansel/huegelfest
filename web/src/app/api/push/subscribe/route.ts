import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/server/lib/webpush';
import { Subscriber } from '@/database/models/Subscriber';
import { logger } from '@/server/lib/logger';
import { isServicesInitialized } from '@/server/lib/init';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  logger.info('[API/Push/Subscribe] Neue Subscription-Anfrage');
  
  try {
    if (!isServicesInitialized()) {
      logger.error('[API/Push/Subscribe] Services sind nicht initialisiert');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Services sind nicht initialisiert'
        },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { endpoint, keys, deviceId } = body;

    if (!endpoint || !keys || !deviceId) {
      logger.warn('[API/Push/Subscribe] Fehlende Pflichtfelder', { 
        hasEndpoint: !!endpoint,
        hasKeys: !!keys,
        hasDeviceId: !!deviceId
      });
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      );
    }

    // Prüfe ob der Subscriber bereits existiert
    const existingSubscriber = await Subscriber.findOne({ deviceId }).exec();
    
    if (existingSubscriber) {
      // Update existierenden Subscriber
      existingSubscriber.endpoint = endpoint;
      existingSubscriber.keys = keys;
      await existingSubscriber.save();
      logger.info('[API/Push/Subscribe] Existierender Subscriber aktualisiert', { deviceId });
    } else {
      // Erstelle neuen Subscriber
      await Subscriber.create({
        deviceId,
        endpoint,
        keys
      });
      logger.info('[API/Push/Subscribe] Neuer Subscriber erstellt', { deviceId });
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Subscription erfolgreich gespeichert'
    });
  } catch (error) {
    logger.error('[API/Push/Subscribe] Fehler bei der Subscription:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Interner Server-Fehler',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
} 