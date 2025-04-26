import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { GroupColors } from '@/lib/types';

const GROUPS_FILE = join(process.cwd(), 'public', 'data', 'groups.json');

export async function GET() {
  try {
    const data = await readFile(GROUPS_FILE, 'utf-8');
    const groups = JSON.parse(data);
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const groups: GroupColors = await request.json();
    
    // Validiere die Daten
    if (typeof groups !== 'object' || groups === null) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    // Speichere die Gruppen
    await writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 