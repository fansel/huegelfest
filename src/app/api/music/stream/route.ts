import { NextRequest } from 'next/server';
import { connectDB } from '@/db/config/connector';
import Music from '@/db/models/Music';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ 
        error: 'ID ist erforderlich',
        details: 'Bitte geben Sie eine gültige Track-ID an'
      }, { status: 400 });
    }

    await connectDB();
    const music = await Music.findById(id);
    
    if (!music) {
      logger.error('[API] GET /api/music/stream - Musik nicht gefunden für ID:', id);
      return Response.json({ 
        error: 'Musik nicht gefunden',
        details: 'Die angeforderte Musik konnte nicht in der Datenbank gefunden werden'
      }, { status: 404 });
    }

    if (!music.audioData) {
      logger.error('[API] GET /api/music/stream - Keine Audio-Daten gefunden für ID:', id);
      return Response.json({ 
        error: 'Keine Audio-Daten gefunden',
        details: 'Die Audio-Daten konnten nicht in der Datenbank gefunden werden'
      }, { status: 404 });
    }

    // Erstelle einen ReadableStream aus dem Buffer
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(music.audioData);
        controller.close();
      }
    });

    // Sende den Stream mit den korrekten Headers
    return new Response(stream, {
      headers: {
        'Content-Type': music.mimeType || 'audio/mpeg',
        'Content-Length': music.audioData.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (error) {
    logger.error('[API] GET /api/music/stream - Fehler:', error);
    return Response.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 