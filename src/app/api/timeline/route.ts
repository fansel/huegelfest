import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { TimelineData } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'src/data');
const TIMELINE_FILE = join(DATA_DIR, 'timeline.json');

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

export async function GET() {
  try {
    await ensureDataDirectory();
    
    const data = await readFile(TIMELINE_FILE, 'utf-8');
    const timeline = JSON.parse(data);
    
    if (!timeline.days || !Array.isArray(timeline.days)) {
      throw new Error('Ungültiges JSON-Format');
    }
    
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Fehler beim Laden der Timeline:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    
    const timeline: TimelineData = await request.json();
    
    if (!timeline.days || !Array.isArray(timeline.days)) {
      return NextResponse.json({ error: 'Ungültiges Datenformat' }, { status: 400 });
    }
    
    await writeFile(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Timeline:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 