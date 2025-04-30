import { NextRequest } from 'next/server';
import { MusicService } from '@/services/MusicService';
import { logger } from '@/lib/logger';

export async function GET() {
  logger.info('[API] GET /api/music - Hole alle Musik-Einträge');
  try {
    const music = await MusicService.getAllMusic();
    logger.info('[API] GET /api/music - Erfolgreich:', music.length, 'Einträge gefunden');
    return Response.json(music);
  } catch (error) {
    logger.error('[API] GET /api/music - Fehler:', error);
    return Response.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  logger.info('[API] POST /api/music - Neue Anfrage');
  try {
    const { url } = await request.json();
    logger.info('[API] POST /api/music - URL:', url);
    
    if (!url) {
      logger.error('[API] POST /api/music - Fehler: URL fehlt');
      return Response.json({ error: 'URL ist erforderlich' }, { status: 400 });
    }
    
    await MusicService.addMusic(url);
    logger.info('[API] POST /api/music - Erfolgreich hinzugefügt');
    return Response.json({ success: true });
  } catch (error) {
    logger.error('[API] POST /api/music - Fehler:', error);
    return Response.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  logger.info('[API] DELETE /api/music - Neue Anfrage');
  try {
    const { url } = await request.json();
    logger.info('[API] DELETE /api/music - URL:', url);
    
    if (!url) {
      logger.error('[API] DELETE /api/music - Fehler: URL fehlt');
      return Response.json({ error: 'URL ist erforderlich' }, { status: 400 });
    }
    
    await MusicService.removeMusic(url);
    logger.info('[API] DELETE /api/music - Erfolgreich gelöscht');
    return Response.json({ success: true });
  } catch (error) {
    logger.error('[API] DELETE /api/music - Fehler:', error);
    return Response.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
} 