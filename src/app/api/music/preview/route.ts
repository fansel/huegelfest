import { NextRequest } from 'next/server';
import { MusicService } from '@/services/MusicService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ 
        error: 'URL ist erforderlich',
        details: 'Bitte geben Sie eine gültige SoundCloud-URL an'
      }, { status: 400 });
    }

    // Hole Track-Informationen
    const trackInfo = await MusicService.getTrackInfo(url);
    
    // Validiere die Track-Informationen
    if (!trackInfo.title || !trackInfo.author_name) {
      return Response.json({ 
        error: 'Ungültige Track-Informationen',
        details: 'Die Track-Informationen konnten nicht vollständig abgerufen werden'
      }, { status: 400 });
    }

    logger.info('[API] POST /api/music/preview - Track-Info erfolgreich abgerufen:', {
      title: trackInfo.title,
      author: trackInfo.author_name,
      hasThumbnail: !!trackInfo.thumbnail_url
    });
    
    return Response.json(trackInfo);
  } catch (error) {
    logger.error('[API] POST /api/music/preview - Fehler:', error);
    return Response.json({ 
      error: 'Fehler beim Abrufen der Track-Informationen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 