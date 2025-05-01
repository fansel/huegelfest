import { NextRequest } from 'next/server';
import { MusicService } from '@/services/MusicService';
import { logger } from '@/lib/logger';
import { connectDB } from '@/db/config/connector';
import Music from '@/db/models/Music';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Wenn eine ID angegeben ist, gib die Audio-Daten zurück
      await connectDB();
      const music = await Music.findById(id);
      
      if (!music) {
        logger.error('[API] GET /api/music - Musik nicht gefunden für ID:', id);
        return Response.json({ 
          error: 'Musik nicht gefunden',
          details: 'Die angeforderte Musik konnte nicht in der Datenbank gefunden werden'
        }, { status: 404 });
      }

      logger.debug('[API] GET /api/music - Gefundene Musik:', {
        id: music._id,
        url: music.url,
        hasAudioData: !!music.audioData,
        audioDataLength: music.audioData?.length,
        mimeType: music.mimeType
      });
      
      if (!music.audioData) {
        logger.error('[API] GET /api/music - Keine Audio-Daten gefunden für ID:', id);
        return Response.json({ 
          error: 'Keine Audio-Daten gefunden',
          details: 'Die Audio-Daten konnten nicht in der Datenbank gefunden werden'
        }, { status: 404 });
      }
      
      // Sende die Audio-Daten direkt als Stream
      return new Response(music.audioData, {
        headers: {
          'Content-Type': music.mimeType || 'audio/mpeg',
          'Content-Length': music.audioData.length.toString()
        }
      });
    }
    
    // Ansonsten gib alle Musik-Einträge zurück
    const music = await MusicService.getAllMusic();
    logger.info('[API] GET /api/music - Erfolgreich alle Einträge zurückgegeben:', music.length);
    return Response.json({
      success: true,
      count: music.length,
      data: music.map(entry => ({
        id: entry._id,
        url: entry.url,
        trackInfo: entry.trackInfo,
        soundcloudInfo: entry.soundcloudResponse,
        // Audio-Daten werden hier nicht mitgesendet
      }))
    });
  } catch (error) {
    logger.error('[API] GET /api/music - Fehler:', error);
    return Response.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  logger.info('[API] POST /api/music - Neue Anfrage');
  try {
    const { url } = await request.json();
    logger.info('[API] POST /api/music - URL:', url);
    
    if (!url) {
      logger.error('[API] POST /api/music - Fehler: URL fehlt');
      return Response.json({ 
        error: 'URL ist erforderlich',
        details: 'Bitte geben Sie eine gültige SoundCloud-URL an'
      }, { status: 400 });
    }

    // Erstelle einen TransformStream für den Download-Status
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Starte den Download-Prozess
    const downloadPromise = (async () => {
      try {
        // Track-Info abrufen
        await writer.write(encoder.encode(JSON.stringify({
          status: 'info',
          message: 'Hole Track-Informationen...'
        }) + '\n'));

        const result = await MusicService.addMusic(url);
        
        // Erfolgreicher Download
        await writer.write(encoder.encode(JSON.stringify({
          status: 'success',
          message: 'Download abgeschlossen',
          data: {
            id: result._id,
            url: result.url,
            trackInfo: result.trackInfo,
            soundcloudInfo: result.soundcloudResponse
          }
        }) + '\n'));

        await writer.close();
      } catch (error) {
        // Fehler beim Download
        await writer.write(encoder.encode(JSON.stringify({
          status: 'error',
          message: 'Fehler beim Download',
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        }) + '\n'));

        await writer.close();
      }
    })();

    // Starte den Download-Prozess
    downloadPromise.catch(error => {
      logger.error('[API] POST /api/music - Unbehandelter Fehler:', error);
    });

    // Warte auf das Ergebnis
    const result = await MusicService.addMusic(url);
    
    // Gib die neuen Daten zurück
    return Response.json({
      success: true,
      data: {
        id: result._id,
        url: result.url,
        trackInfo: result.trackInfo,
        soundcloudInfo: result.soundcloudResponse
      }
    });
  } catch (error) {
    logger.error('[API] POST /api/music - Fehler:', error);
    return Response.json({ 
      error: 'Fehler beim Hinzufügen der Musik',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  logger.info('[API] DELETE /api/music - Neue Anfrage');
  try {
    const { url } = await request.json();
    logger.info('[API] DELETE /api/music - URL:', url);
    
    if (!url) {
      logger.error('[API] DELETE /api/music - Fehler: URL fehlt');
      return Response.json({ 
        error: 'URL ist erforderlich',
        details: 'Bitte geben Sie eine gültige SoundCloud-URL an'
      }, { status: 400 });
    }
    
    await MusicService.removeMusic(url);
    logger.info('[API] DELETE /api/music - Erfolgreich gelöscht');
    return Response.json({ 
      success: true,
      message: 'Musik erfolgreich gelöscht'
    });
  } catch (error) {
    logger.error('[API] DELETE /api/music - Fehler:', error);
    return Response.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 