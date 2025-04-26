import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MUSIC_FILE = path.join(process.cwd(), 'public', 'data', 'music.json');

export async function GET() {
  try {
    const data = fs.readFileSync(MUSIC_FILE, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { urls } = await request.json();
    
    // Validiere die URLs
    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Ungültiges Format. URLs müssen ein Array sein.' },
        { status: 400 }
      );
    }

    // Stelle sicher, dass das Verzeichnis existiert
    const dir = path.dirname(MUSIC_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Speichere die URLs
    fs.writeFileSync(MUSIC_FILE, JSON.stringify(urls, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Musik-URLs:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 