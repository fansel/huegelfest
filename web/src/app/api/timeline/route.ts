import { NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import { Timeline } from '@/database/models/Timeline';
import { logger } from '@/server/lib/logger';

// Hilfsfunktion zum Bereinigen der Timeline-Daten
const cleanTimelineData = (timeline: any) => {
  if (!timeline) return null;
  
  return {
    days: timeline.days.map((day: any) => ({
      _id: day._id,
      title: day.title,
      description: day.description,
      date: day.date,
      events: day.events.map((event: any) => ({
        _id: event._id,
        time: event.time,
        title: event.title,
        description: event.description,
        categoryId: event.categoryId
      }))
    }))
  };
};

export async function GET() {
  try {
    logger.info('[Timeline API] Starte GET-Anfrage');
    
    // Verbindung zur Datenbank herstellen
    await connectDB();
    logger.info('[Timeline API] Datenbankverbindung hergestellt');

    // Hole die neueste Timeline
    const timeline = await Timeline.findOne()
      .sort({ createdAt: -1 })
      .lean();
    
    logger.info('[Timeline API] Timeline abgefragt:', { 
      found: !!timeline,
      hasDays: timeline?.days?.length > 0
    });

    // Wenn keine Timeline existiert, gib 404 zurück
    if (!timeline || !timeline.days || timeline.days.length === 0) {
      logger.info('[Timeline API] Keine Timeline gefunden');
      return NextResponse.json(
        { error: 'Keine Timeline gefunden' },
        { status: 404 }
      );
    }

    // Bereinige die Daten
    const cleanedTimeline = cleanTimelineData(timeline);
    logger.info('[Timeline API] Timeline-Daten bereinigt');

    // Sende die bereinigten Daten
    return NextResponse.json(cleanedTimeline);
  } catch (error) {
    logger.error('[Timeline API] Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/timeline - Starte Timeline-Aktualisierung');
    await connectDB();
    const data = await request.json();
    console.log('POST /api/timeline - Empfangene Daten:', JSON.stringify(data, null, 2));
    
    // Validiere die Daten
    if (!data.days || !Array.isArray(data.days)) {
      console.log('POST /api/timeline - Ungültiges Format: days muss ein Array sein');
      return NextResponse.json(
        { error: 'Ungültiges Format: days muss ein Array sein' },
        { status: 400 }
      );
    }

    // Validiere jeden Tag
    for (const day of data.days) {
      if (!day.title || !day.description) {
        console.log('POST /api/timeline - Ungültiges Format: Jeder Tag muss title und description haben');
        return NextResponse.json(
          { error: 'Ungültiges Format: Jeder Tag muss title und description haben' },
          { status: 400 }
        );
      }
    }
    
    // Finde die aktuelle Timeline
    let timeline = await Timeline.findOne().sort({ createdAt: -1 });
    
    if (timeline) {
      // Aktualisiere die bestehende Timeline
      console.log('POST /api/timeline - Aktualisiere bestehende Timeline');
      timeline.days = data.days;
      await timeline.save();
    } else {
      // Erstelle eine neue Timeline
      console.log('POST /api/timeline - Erstelle neue Timeline');
      timeline = await Timeline.create(data);
    }
    
    console.log('POST /api/timeline - Timeline erfolgreich aktualisiert');
    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Timeline:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Aktualisieren der Timeline' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('PUT /api/timeline - Starte Timeline-Aktualisierung');
    await connectDB();
    const data = await request.json();
    console.log('PUT /api/timeline - Empfangene Daten:', JSON.stringify(data, null, 2));
    
    // Validiere die Daten
    if (!data.days || !Array.isArray(data.days)) {
      console.log('PUT /api/timeline - Ungültiges Format: days muss ein Array sein');
      return NextResponse.json(
        { error: 'Ungültiges Format: days muss ein Array sein' },
        { status: 400 }
      );
    }

    // Validiere jeden Tag
    for (const day of data.days) {
      console.log('PUT /api/timeline - Validiere Tag:', day.title);
      if (!day.title || !day.description) {
        console.log('PUT /api/timeline - Ungültiges Format: Jeder Tag muss title und description haben');
        return NextResponse.json(
          { error: 'Ungültiges Format: Jeder Tag muss title und description haben' },
          { status: 400 }
        );
      }

      // Validiere Events
      if (day.events && Array.isArray(day.events)) {
        console.log('PUT /api/timeline - Validiere Events für Tag:', day.title);
        for (const event of day.events) {
          console.log('PUT /api/timeline - Validiere Event:', event.title);
          if (!event.time || !event.title || !event.description) {
            console.log('PUT /api/timeline - Ungültiges Event Format:', event);
            return NextResponse.json(
              { error: 'Ungültiges Format: Jedes Event muss time, title und description haben' },
              { status: 400 }
            );
          }
        }
      }
    }
    
    // Bereinige die Daten
    const cleanedData = cleanTimelineData(data);
    console.log('PUT /api/timeline - Bereinigte Daten:', JSON.stringify(cleanedData, null, 2));
    
    // Finde die aktuelle Timeline
    let timeline = await Timeline.findOne().sort({ createdAt: -1 });
    console.log('PUT /api/timeline - Aktuelle Timeline gefunden:', timeline ? 'Ja' : 'Nein');
    
    if (timeline) {
      // Aktualisiere die bestehende Timeline
      console.log('PUT /api/timeline - Aktualisiere bestehende Timeline');
      timeline.days = cleanedData.days;
      await timeline.save();
      console.log('PUT /api/timeline - Timeline erfolgreich aktualisiert');
    } else {
      // Erstelle eine neue Timeline
      console.log('PUT /api/timeline - Erstelle neue Timeline');
      timeline = await Timeline.create(cleanedData);
      console.log('PUT /api/timeline - Neue Timeline erstellt');
    }
    
    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error('PUT /api/timeline - Fehler beim Aktualisieren der Timeline:', error);
    console.error('PUT /api/timeline - Fehler Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Aktualisieren der Timeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }
    
    const timeline = await Timeline.findByIdAndDelete(id);
    
    if (!timeline) {
      return NextResponse.json(
        { error: 'Timeline nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Timeline erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Timeline:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 