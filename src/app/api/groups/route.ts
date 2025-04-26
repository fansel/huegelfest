import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GroupColors } from '@/lib/types';

const DATA_DIR = join(process.cwd(), 'data');
const GROUPS_FILE = join(DATA_DIR, 'groups.json');

async function ensureDataDirectory() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function ensureGroupsFile() {
  try {
    await readFile(GROUPS_FILE);
  } catch {
    await writeFile(GROUPS_FILE, JSON.stringify({}, null, 2));
  }
}

export async function GET() {
  try {
    await ensureDataDirectory();
    await ensureGroupsFile();
    
    const data = await readFile(GROUPS_FILE, 'utf-8');
    const groups = JSON.parse(data);
    
    if (typeof groups !== 'object' || groups === null) {
      throw new Error('Ungültiges JSON-Format');
    }
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataDirectory();
    await ensureGroupsFile();
    
    const groups: GroupColors = await request.json();
    
    if (typeof groups !== 'object' || groups === null) {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 });
    }
    
    await writeFile(GROUPS_FILE, JSON.stringify(groups, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 