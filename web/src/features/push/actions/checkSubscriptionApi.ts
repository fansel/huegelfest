import { NextResponse } from 'next/server';
import { Subscriber } from '@/lib/db/models/Subscriber';
import { isServicesInitialized } from '@/server/lib/init';
import { logger } from '@/server/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    if (!isServicesInitialized()) {
      logger.error('Services sind nicht initialisiert');
      return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 });
    }

    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID fehlt' }, { status: 400 });
    }

    const subscriber = await Subscriber.findOne({ deviceId }).exec();
    
    return NextResponse.json({ exists: !!subscriber });
  } catch (error) {
    logger.error('Fehler beim Prüfen der Subscription:', error);
    return NextResponse.json({ error: 'Interner Server Fehler' }, { status: 500 });
  }
} 