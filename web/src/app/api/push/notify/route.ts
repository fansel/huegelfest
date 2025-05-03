import { NextRequest, NextResponse } from 'next/server'
import { webPushService } from '@/server/lib/webpush'

export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    const { title, body: messageBody, icon, badge, data } = requestBody;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Titel und Nachricht sind erforderlich' },
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

    return NextResponse.json({ message: 'Benachrichtigung gesendet' });
  } catch (error) {
    console.error('Fehler beim Senden der Benachrichtigung:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 