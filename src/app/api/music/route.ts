import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MUSIC_FILE = path.join(DATA_DIR, 'music.json');

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function ensureDataDirectory() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      return;
    }
    throw error;
  }
}

async function ensureMusicFile() {
  try {
    await readFile(MUSIC_FILE);
  } catch {
    await writeFile(MUSIC_FILE, JSON.stringify({ urls: [] }, null, 2));
  }
}

export async function GET() {
  try {
    await ensureDataDirectory();
    await ensureMusicFile();
    
    const data = await readFile(MUSIC_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    
    if (!parsedData.urls || !Array.isArray(parsedData.urls)) {
      throw new Error('Ungültiges JSON-Format');
    }
    
    return NextResponse.json(parsedData.urls);
  } catch (error) {
    console.error('Fehler beim Lesen der Musik-Datei:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    await ensureMusicFile();
    
    const urls = await request.json();
    
    if (!Array.isArray(urls)) {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 });
    }

    // Validiere alle URLs
    for (const url of urls) {
      if (!url || !isValidUrl(url)) {
        return NextResponse.json({ error: 'Ungültige URL gefunden' }, { status: 400 });
      }
    }

    // Speichere das gesamte Array
    await writeFile(MUSIC_FILE, JSON.stringify({ urls }, null, 2));
    
    return NextResponse.json(urls);
  } catch (error) {
    console.error('Fehler beim Speichern der Musik-Datei:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 