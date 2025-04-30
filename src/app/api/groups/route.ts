import { NextResponse } from 'next/server';
import { connectDB } from '@/db/config/connector';
import Group from '@/db/models/Group';
import { GroupColors } from '@/lib/types';
import { sendUpdateToAllClients } from '@/lib/sse';

export async function GET() {
  try {
    await connectDB();
    const groups = await Group.find();
    
    // Konvertiere zu GroupColors Format
    const groupColors: GroupColors = {};
    groups.forEach(group => {
      groupColors[group.name] = group.color;
    });
    
    return NextResponse.json(groupColors);
  } catch (error) {
    console.error('Fehler beim Laden der Gruppen:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const groupColors: GroupColors = await request.json();
    
    if (typeof groupColors !== 'object' || groupColors === null) {
      return NextResponse.json({ error: 'Ungültiges Format' }, { status: 400 });
    }

    // Aktualisiere oder erstelle einzelne Gruppen
    for (const [name, color] of Object.entries(groupColors)) {
      await Group.findOneAndUpdate(
        { name },
        { name, color },
        { upsert: true, new: true }
      );
    }
    
    // Sende Update an alle Clients
    sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 