import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MUSIC_FILE = path.join(process.cwd(), 'public', 'data', 'music.json');

// Erlaubte Domains
const ALLOWED_DOMAINS = [
  'huegelfest.fansel.dev',
  'xn--hgelfest-65a.fansel.dev'
];

function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.includes(urlObj.hostname);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const data = fs.readFileSync(MUSIC_FILE, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 });
    }

    const musicData = JSON.parse(fs.readFileSync(MUSIC_FILE, 'utf-8'));
    musicData.urls.push(url);
    fs.writeFileSync(MUSIC_FILE, JSON.stringify(musicData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 