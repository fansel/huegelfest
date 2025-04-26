import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Announcement } from '@/lib/types';

const ANNOUNCEMENTS_FILE = join(process.cwd(), 'public', 'data', 'announcements.json');

// Funktion zum Senden von Push-Benachrichtigungen
async function sendPushNotification(title: string, message: string) {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        included_segments: ["Subscribed Users"],
        headings: { en: title },
        contents: { en: message },
        url: process.env.NEXT_PUBLIC_SITE_URL,
      }),
    });

    if (!response.ok) {
      throw new Error('Fehler beim Senden der Push-Benachrichtigung');
    }

    return await response.json();
  } catch (error) {
    console.error('Fehler beim Senden der Push-Benachrichtigung:', error);
  }
}

export async function GET() {
  try {
    const data = await readFile(ANNOUNCEMENTS_FILE, 'utf-8');
    const { announcements } = JSON.parse(data);
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const announcements: Announcement[] = await request.json();
    
    // Validiere die Daten
    if (!Array.isArray(announcements)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    // Speichere die Ankündigungen
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements }, null, 2));

    // Sende Push-Benachrichtigung für die neueste Ankündigung
    const latestAnnouncement = announcements[announcements.length - 1];
    if (latestAnnouncement) {
      await sendPushNotification(
        "Neue Ankündigung",
        latestAnnouncement.content
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Ankündigungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 