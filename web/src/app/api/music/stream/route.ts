import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/config/apiConnector';
import Music from '@/database/models/Music';
import { logger } from '@/server/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      logger.error('[API] Keine ID angegeben');
      return NextResponse.json(
        { error: 'ID ist erforderlich' },
        { status: 400 }
      );
    }

    await connectDB();
    const music = await Music.findById(id);
    
    if (!music) {
      logger.error('[API] Musik nicht gefunden für ID:', id);
      return NextResponse.json(
        { error: 'Musik nicht gefunden' },
        { status: 404 }
      );
    }

    if (!music.audioData) {
      logger.error('[API] Keine Audio-Daten gefunden für ID:', id);
      return NextResponse.json(
        { error: 'Keine Audio-Daten gefunden' },
        { status: 404 }
      );
    }

    return new NextResponse(music.audioData, {
      headers: {
        'Content-Type': music.mimeType || 'audio/mpeg',
        'Content-Length': music.audioData.length.toString(),
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    logger.error('[API] Fehler beim Streamen der Musik:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Streamen der Musik' },
      { status: 500 }
    );
  }
}
