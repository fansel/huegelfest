import { NextResponse } from 'next/server';
import { getAnnouncements, saveAnnouncements } from '../../announcements/actions';
import type { Announcement } from '@/lib/types';
import { sendUpdateToAllClients } from '../updates/route';

export async function GET() {
  try {
    const announcements = await getAnnouncements();
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Fehler beim Laden der Ankündigungen:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const announcements: Announcement[] = await request.json();
    
    if (!Array.isArray(announcements)) {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 });
    }
    
    const result = await saveAnnouncements(announcements);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    // Sende Update an alle verbundenen Clients
    sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Ankündigungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 