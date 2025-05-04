import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import Group from '@/database/models/Group';
import { GroupColors } from '@/types/types';
import { sseService } from '@/server/lib/sse';

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
        { name, color, updatedAt: new Date() },
        { upsert: true }
      );
    }
    
    sseService.sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Speichern der Gruppen:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name und Farbe sind erforderlich' },
        { status: 400 }
      );
    }

    await connectDB();
    await Group.findOneAndUpdate(
      { name },
      { color, updatedAt: new Date() },
      { upsert: true }
    );

    sseService.sendUpdateToAllClients();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Gruppe:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 