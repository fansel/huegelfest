import { NextRequest, NextResponse } from 'next/server';
import { MusicService } from '@/server/services/MusicService';
import { logger } from '@/server/lib/logger';
import { connectDB } from '@/database/config/connector';
import Music from '@/database/models/Music';

export async function GET() {
  try {
    logger.info('[API] GET /api/music - Hole alle Musik-Einträge');
    await connectDB();
    const music = await Music.find({})
      .select('-audioData')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      count: music.length,
      data: music.map(track => ({
        id: track._id.toString(),
        url: track.url,
        trackInfo: track.trackInfo
      }))
    });
  } catch (error) {
    logger.error('[API] Fehler beim Abrufen der Musik:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Fehler beim Abrufen der Musik',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    logger.info('[API] POST /api/music - Füge neue Musik hinzu:', url);

    if (!url) {
      logger.error('[API] Keine URL angegeben');
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    const music = await MusicService.addMusic(url);
    logger.info('[API] Musik erfolgreich hinzugefügt:', music._id);
    return NextResponse.json(music);
  } catch (error) {
    logger.error('[API] Fehler beim Hinzufügen der Musik:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Musik' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();
    logger.info('[API] DELETE /api/music - Entferne Musik:', url);

    if (!url) {
      logger.error('[API] Keine URL angegeben');
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }

    await MusicService.removeMusic(url);
    logger.info('[API] Musik erfolgreich entfernt:', url);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Fehler beim Entfernen der Musik:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler beim Entfernen der Musik' },
      { status: 500 }
    );
  }
}
