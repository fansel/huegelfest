import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Announcement } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'data');
const ANNOUNCEMENTS_FILE = join(DATA_DIR, 'announcements.json');

async function ensureDataDirectory() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function ensureAnnouncementsFile() {
  try {
    await readFile(ANNOUNCEMENTS_FILE);
  } catch {
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements: [] }, null, 2));
  }
}

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
    await ensureDataDirectory();
    await ensureAnnouncementsFile();
    
    const data = await readFile(ANNOUNCEMENTS_FILE, 'utf-8');
    const parsedData = JSON.parse(data);
    
    if (!parsedData.announcements || !Array.isArray(parsedData.announcements)) {
      throw new Error('Ungültiges JSON-Format');
    }
    
    return NextResponse.json(parsedData.announcements);
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    await ensureAnnouncementsFile();
    
    const announcements: Announcement[] = await request.json();
    
    if (!Array.isArray(announcements)) {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 });
    }
    
    await writeFile(ANNOUNCEMENTS_FILE, JSON.stringify({ announcements }, null, 2));
    
    // Sende Push-Benachrichtigung für die neueste Ankündigung
    if (announcements.length > 0) {
      const latest = announcements[announcements.length - 1];
      await sendPushNotification("Neue Ankündigung", latest.content);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Ankündigungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 