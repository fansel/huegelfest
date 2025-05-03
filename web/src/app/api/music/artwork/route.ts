import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/config/connector';
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

    if (!music.trackInfo.thumbnail_url) {
      logger.error('[API] Kein Thumbnail gefunden für ID:', id);
      return NextResponse.json(
        { error: 'Kein Thumbnail gefunden' },
        { status: 404 }
      );
    }

    // Lade das Thumbnail von SoundCloud
    const response = await fetch(music.trackInfo.thumbnail_url);
    if (!response.ok) {
      logger.error('[API] Fehler beim Laden des Thumbnails:', response.status);
      return NextResponse.json(
        { error: 'Fehler beim Laden des Thumbnails' },
        { status: 500 }
      );
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    logger.error('[API] Fehler beim Laden des Thumbnails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Laden des Thumbnails' },
      { status: 500 }
    );
  }
}
