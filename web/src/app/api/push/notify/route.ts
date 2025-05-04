import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/server/lib/webpush';
import { logger } from '@/server/lib/logger';
import { isServicesInitialized } from '@/server/lib/init';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  logger.info('[API/Push/Notify] Neue Benachrichtigungsanfrage');
  
  try {
    if (!isServicesInitialized()) {
      logger.error('[API/Push/Notify] Services sind nicht initialisiert');
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Services sind nicht initialisiert'
        },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { title, body: messageBody, icon, badge, data } = body;

    if (!title || !messageBody) {
      logger.warn('[API/Push/Notify] Fehlende Pflichtfelder', { 
        hasTitle: !!title,
        hasBody: !!messageBody
      });
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      );
    }

    await webPushService.sendNotificationToAll({
      title,
      body: messageBody,
      icon,
      badge,
      data
    });

    return NextResponse.json({ 
      status: 'success',
      message: 'Benachrichtigungen erfolgreich gesendet'
    });
  } catch (error) {
    logger.error('[API/Push/Notify] Fehler beim Senden der Benachrichtigungen:', {
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