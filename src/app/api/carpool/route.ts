import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const filePath = path.join(process.cwd(), 'src/data/carpool.json');
    
    // Speichere die Daten in der JSON-Datei
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Daten:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Daten' },
      { status: 500 }
    );
  }
} 