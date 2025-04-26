import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const { announcements } = await request.json();
    
    // Validiere die Daten
    if (!Array.isArray(announcements)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    // Speichere die Ankündigungen in der JSON-Datei
    const filePath = join(process.cwd(), 'public', 'data', 'announcements.json');
    await writeFile(filePath, JSON.stringify({ announcements }, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Ankündigungen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 