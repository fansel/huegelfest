export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { webPushService } from '@/server/lib/lazyServices'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, body: messageBody, icon, badge, data } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Titel und Nachricht sind erforderlich' },
        { status: 400 }
      );
    }

    const service = await webPushService.getInstance();
    if (!service.isInitialized()) {
      return NextResponse.json(
        { error: 'Push-Benachrichtigungen sind nicht verfügbar' },
        { status: 503 }
      );
    }

    await service.sendNotificationToAll({
      title,
      body: messageBody,
      icon,
      badge,
      data
    });

    return NextResponse.json({ message: 'Benachrichtigung gesendet' });
  } catch (error) {
    console.error('Fehler beim Senden der Push-Benachrichtigung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 