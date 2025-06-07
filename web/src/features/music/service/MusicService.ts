import { connectDB } from '@/lib/db/connector';
import Music, { MusicDocument, TrackInfo } from '@/lib/db/models/Music';
import { logger } from '@/lib/logger';
import scdl from 'soundcloud-downloader';
import fetch from 'node-fetch';

export class MusicService {
  private static clientId: string;

  private static async extractClientId(html: string): Promise<string | null> {
    try {
      // Suche nach dem Script-Tag mit der Client-ID
      const scriptUrlMatch = html.match(/https:\/\/[^"]*js\/app-[^"]*\.js/);
      if (!scriptUrlMatch) {
        // Alternative Methode: Suche direkt nach der Client-ID im HTML
        const directClientIdMatch = html.match(/client_id:"([^"]+)"/);
        if (directClientIdMatch) {
          return directClientIdMatch[1];
        }
        return null;
      }

      const scriptResponse = await fetch(scriptUrlMatch[0]);
      if (!scriptResponse.ok) {
        throw new Error(`Failed to fetch script: ${scriptResponse.status}`);
      }
      const scriptContent = await scriptResponse.text();

      // Versuche verschiedene Muster für die Client-ID
      const patterns = [
        /client_id:"([^"]+)"/,
        /clientId:"([^"]+)"/,
        /client_id=([^&]+)/,
        /clientId=([^&]+)/
      ];

      for (const pattern of patterns) {
        const match = scriptContent.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      logger.error('[MusicService] Fehler beim Extrahieren der Client-ID:', error);
      return null;
    }
  }

  private static async fetchClientId(): Promise<string> {
    try {
      logger.debug('[MusicService] Versuche Client-ID aus SoundCloud Assets zu holen...');
      
      // Hole die Hauptseite
      const response = await fetch('https://soundcloud.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Extrahiere alle JavaScript Asset URLs
      const jsUrls = html.match(/src="https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]*\.js"/g) || [];
      
      // Entferne die src=" und " von den URLs
      const cleanJsUrls = jsUrls.map(url => url.slice(5, -1));
      
      logger.debug(`[MusicService] Gefundene JS Assets: ${cleanJsUrls.length}`);

      // Durchsuche jede JS-Datei nach der Client-ID
      for (const jsUrl of cleanJsUrls) {
        try {
          logger.debug(`[MusicService] Prüfe JS Asset: ${jsUrl}`);
          const jsResponse = await fetch(jsUrl);
          if (!jsResponse.ok) continue;
          
          const jsContent = await jsResponse.text();
          const clientIdMatch = jsContent.match(/client_id=([a-zA-Z0-9]{32})/);
          
          if (clientIdMatch && clientIdMatch[1]) {
            logger.info('[MusicService] Client-ID in JS Asset gefunden');
            return clientIdMatch[1];
          }
        } catch (error) {
          logger.warn(`[MusicService] Fehler beim Laden des JS Assets: ${jsUrl}`, error);
          continue;
        }
      }

      throw new Error('Keine Client-ID in den JS Assets gefunden');
    } catch (error) {
      logger.error('[MusicService] Fehler beim Abrufen der Client-ID:', error);
      if (error instanceof Error) {
        logger.error(`[MusicService] Fehlerdetails: ${error.message}`);
        logger.error(`[MusicService] Stack: ${error.stack}`);
      }
      throw error;
    }
  }

  private static async getClientId(): Promise<string> {
    try {
      // Hole direkt eine neue Client-ID
      const clientId = await this.fetchClientId();
      logger.info('[MusicService] Neue Client-ID erfolgreich abgerufen');
      return clientId;
    } catch (error) {
      logger.error('[MusicService] Fehler beim Laden der Client-ID:', error);
      throw new Error('Fehler beim Laden der SoundCloud Client-ID');
    }
  }

  private static isValidUrl(url: string): boolean {
    logger.debug('[MusicService] Überprüfe URL:', url);
    try {
      if (url.includes('on.soundcloud.com')) {
        logger.debug('[MusicService] URL ist eine SoundCloud-URL');
        return true;
      }
      
      // Erweiterte SoundCloud URL-Erkennung
      if (url.includes('soundcloud.com')) {
        // Prüfe auf unterstützte URL-Formate
        const supportedPatterns = [
          /soundcloud\.com\/[^\/]+\/[^\/]+/,  // Standard Track URLs
          /soundcloud\.com\/[^\/]+\/sets\/[^\/]+/, // Set URLs (Playlists)
          /on\.soundcloud\.com\//, // Short URLs
        ];
        
        const isSupported = supportedPatterns.some(pattern => pattern.test(url));
        if (!isSupported) {
          logger.warn('[MusicService] SoundCloud URL-Format wird möglicherweise nicht unterstützt:', url);
        }
        return isSupported;
      }
      
      new URL(url);
      logger.debug('[MusicService] URL ist gültig');
      return true;
    } catch {
      logger.debug('[MusicService] URL ist ungültig');
      return false;
    }
  }

  private static async resolveShortUrl(url: string): Promise<string> {
    logger.debug('[MusicService] Löse kurze URL auf:', url);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
      logger.debug('[MusicService] Aufgelöste URL:', response.url);
      return response.url;
    } catch (error) {
      logger.error('[MusicService] Fehler beim Auflösen der kurzen URL:', error);
      throw new Error('Fehler beim Auflösen der kurzen URL');
    }
  }

  public static async getTrackInfo(url: string): Promise<TrackInfo> {
    logger.debug('[MusicService] Hole SoundCloud Track-Info...');
    try {
      const clientId = await this.getClientId();
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
        logger.info('[MusicService] Aufgelöste URL:', url);
      }
      
      // Zusätzliche URL-Validierung vor API-Aufruf
      if (!url.includes('soundcloud.com')) {
        throw new Error('Nur SoundCloud URLs werden unterstützt');
      }
      
      logger.debug('[MusicService] Versuche Track-Info von SoundCloud abzurufen...');
      scdl.setClientID(clientId);
      const trackInfo = await scdl.getInfo(url);
      logger.debug('[MusicService] SoundCloud Track-Info erhalten:', trackInfo);
      
      if (!trackInfo || !trackInfo.title) {
        throw new Error('Ungültige Track-Informationen von SoundCloud - Track möglicherweise privat');
      }
      
      // Prüfe ob Track downloadbar ist
      if (trackInfo.downloadable === false && !trackInfo.streamable) {
        throw new Error('Track ist nicht streambar - möglicherweise geografisch eingeschränkt oder privat');
      }
      
      return {
        title: trackInfo.title,
        author_name: trackInfo.user?.username || 'Unbekannter Künstler',
        thumbnail_url: trackInfo.artwork_url || trackInfo.user?.avatar_url || '',
        author_url: trackInfo.user?.permalink_url || '',
        description: trackInfo.description || '',
        html: (trackInfo as any).embed_html || ''
      };
    } catch (error) {
      logger.error('[MusicService] Fehler beim Abrufen der Track-Info:', error);
      if (error instanceof Error) {
        // Verbesserte Fehlermeldungen für häufige Probleme
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new Error('Track nicht gefunden. Mögliche Gründe:\n• Track ist privat oder unlisted\n• Track wurde gelöscht\n• Geografische Beschränkungen\n• Track ist nur für SoundCloud Go+ verfügbar');
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Zugriff verweigert. Track ist wahrscheinlich:\n• Privat\n• Geografisch beschränkt\n• Nur für Premium-Nutzer verfügbar');
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('SoundCloud API-Authentifizierung fehlgeschlagen - Client-ID ungültig oder abgelaufen');
        }
        if (error.message.includes('429') || error.message.includes('Rate limit')) {
          throw new Error('SoundCloud API-Limit erreicht - bitte versuche es in ein paar Minuten erneut');
        }
        if (error.message.includes('Invalid URL')) {
          throw new Error('Ungültige SoundCloud URL - unterstützt werden nur direkte Track-Links');
        }
        if (error.message.includes('could not find the song')) {
          throw new Error(
            'Track konnte nicht heruntergeladen werden. Mögliche Gründe:\n' +
            '• Der Track wurde gelöscht\n' +
            '• Der Track ist privat\n' +
            '• Der Track ist in deiner Region nicht verfügbar\n' +
            '• Der Track ist nur für SoundCloud Go+ verfügbar\n' +
            '• Der Track wurde vom Künstler oder Label gesperrt'
          );
        }
        throw new Error(`Fehler beim Abrufen der Track-Informationen: ${error.message}`);
      }
      throw new Error('Unbekannter Fehler beim Abrufen der Track-Informationen');
    }
  }

  /**
   * Prüft ob ein Track verfügbar und downloadbar ist
   */
  public static async checkTrackAvailability(url: string): Promise<{ isAvailable: boolean; reason?: string; trackInfo?: any }> {
    try {
      const trackInfo = await this.getTrackInfo(url);
      
      // Versuche den Download mit allen Methoden
      try {
        // Nur kurz testen ob der Download prinzipiell möglich ist
        const downloadTest = await this.downloadAudioWithFallback(url);
        if (downloadTest.buffer.length > 0) {
          return { isAvailable: true, trackInfo };
        }
      } catch (downloadError) {
        logger.warn('[MusicService] Download-Test fehlgeschlagen:', downloadError);
        // Fehler hier nicht werfen - wir geben stattdessen zurück dass der Track nicht verfügbar ist
      }
      
      return { 
        isAvailable: false, 
        reason: 'Track konnte nicht heruntergeladen werden',
        trackInfo 
      };

    } catch (error) {
      logger.error('[MusicService] Fehler bei Verfügbarkeitsprüfung:', error);
      if (error instanceof Error) {
        return { isAvailable: false, reason: error.message };
      }
      return { isAvailable: false, reason: 'Unbekannter Fehler bei der Verfügbarkeitsprüfung' };
    }
  }

  private static async downloadAudioWithFallback(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    logger.debug('[MusicService] Starte Audio-Download mit Fallback für URL:', url);
    
    // Resolve URL if it's a short URL
    if (url.includes('on.soundcloud.com')) {
      url = await this.resolveShortUrl(url);
      logger.info('[MusicService] Aufgelöste URL:', url);
    }
    
    // Liste der Download-Methoden
    const downloadMethods = [
      this.downloadWithSCDL,
      this.downloadWithMobileAPI,
      this.downloadWithDirectAPI,
      this.downloadWithMediaAPI
    ];

    let lastError: Error | null = null;

    // Versuche nacheinander alle Download-Methoden
    for (const method of downloadMethods) {
      try {
        const result = await method(url);
        if (result && result.buffer && result.buffer.length > 0) {
          logger.info(`[MusicService] Download erfolgreich mit Methode ${method.name}`);
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[MusicService] Download-Methode ${method.name} fehlgeschlagen:`, error);
        continue;
      }
    }

    // Wenn keine Methode erfolgreich war
    throw lastError || new Error('Alle Download-Methoden fehlgeschlagen');
  }

  private static async downloadWithSCDL(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const clientId = await MusicService.getClientId();
    scdl.setClientID(clientId);
    const stream = await scdl.download(url);
    
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    
    return {
      buffer: Buffer.concat(chunks),
      mimeType: 'audio/mpeg'
    };
  }

  private static async downloadWithMobileAPI(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const clientId = await MusicService.getClientId();
    
    // 1. Hole zuerst die Track-ID über die mobile API
    const mobileHeaders = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      'Accept': 'application/json'
    };

    // Versuche erst die Track-ID zu bekommen
    const resolveResponse = await fetch(`https://api-v2.soundcloud.com/resolve?url=${url}&client_id=${clientId}`, {
      headers: mobileHeaders
    });
    
    if (!resolveResponse.ok) {
      throw new Error(`Mobile API Resolve Fehler: ${resolveResponse.status}`);
    }

    const trackData = await resolveResponse.json() as { id?: number; media?: { transcodings?: Array<{ url: string, format: { protocol: string } }> } };
    
    if (!trackData?.id) {
      throw new Error('Track ID nicht gefunden');
    }

    // 2. Hole die verfügbaren Transcodings
    const trackResponse = await fetch(`https://api-v2.soundcloud.com/tracks/${trackData.id}?client_id=${clientId}`, {
      headers: mobileHeaders
    });

    if (!trackResponse.ok) {
      throw new Error(`Track API Fehler: ${trackResponse.status}`);
    }

    const fullTrackData = await trackResponse.json() as { media?: { transcodings?: Array<{ url: string, format: { protocol: string } }> } };
    
    // 3. Suche nach progressiver MP3-URL oder HLS-Stream
    const transcodings = fullTrackData?.media?.transcodings || [];
    let mediaUrl: string | null = null;

    // Priorisiere progressive Downloads über HLS
    const progressive = transcodings.find(t => t.format.protocol === 'progressive');
    const hls = transcodings.find(t => t.format.protocol === 'hls');
    
    const transcoding = progressive || hls;
    if (!transcoding?.url) {
      throw new Error('Keine Download-URL gefunden');
    }

    // 4. Hole die finale Media-URL
    const mediaResponse = await fetch(`${transcoding.url}?client_id=${clientId}`, {
      headers: mobileHeaders
    });

    if (!mediaResponse.ok) {
      throw new Error(`Media URL Fehler: ${mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json() as { url?: string };
    if (!mediaData?.url) {
      throw new Error('Keine finale Download-URL gefunden');
    }

    // 5. Lade den tatsächlichen Audio-Stream
    const audioResponse = await fetch(mediaData.url, {
      headers: {
        'User-Agent': mobileHeaders['User-Agent'],
        'Range': 'bytes=0-' // Wichtig für einige CDN-Server
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Audio Download Fehler: ${audioResponse.status}`);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: audioResponse.headers.get('content-type') || 'audio/mpeg'
    };
  }

  private static async downloadWithDirectAPI(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const clientId = await MusicService.getClientId();
    
    // Hole Track-ID aus der URL
    const trackResponse = await fetch(`https://api-v2.soundcloud.com/resolve?url=${url}&client_id=${clientId}`);
    const trackData = await trackResponse.json() as { id?: number };
    
    if (!trackData?.id) {
      throw new Error('Track ID nicht gefunden');
    }

    // Hole Download/Stream URL
    const mediaResponse = await fetch(`https://api-v2.soundcloud.com/tracks/${trackData.id}/stream?client_id=${clientId}`);
    if (!mediaResponse.ok) {
      throw new Error(`Media API Fehler: ${mediaResponse.status}`);
    }

    const mediaUrl = await mediaResponse.text();
    const audioResponse = await fetch(mediaUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();
    
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: audioResponse.headers.get('content-type') || 'audio/mpeg'
    };
  }

  private static async downloadWithMediaAPI(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const clientId = await MusicService.getClientId();
    
    // Alternative Media API Endpoint
    const mediaResponse = await fetch(`https://api-widget.soundcloud.com/resolve?url=${url}&client_id=${clientId}&format=json`);
    const mediaData = await mediaResponse.json() as { stream_url?: string };
    
    if (!mediaData?.stream_url) {
      throw new Error('Stream URL nicht gefunden');
    }

    const streamUrl = `${mediaData.stream_url}?client_id=${clientId}`;
    const audioResponse = await fetch(streamUrl);
    const arrayBuffer = await audioResponse.arrayBuffer();
    
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: audioResponse.headers.get('content-type') || 'audio/mpeg'
    };
  }
  private static async downloadAudio(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      return await this.downloadAudioWithFallback(url);
    } catch (error) {
      logger.error('[MusicService] Fehler beim Herunterladen der Audio-Datei:', error);
      throw error;
    }
  }

  public static async getAllMusic(): Promise<MusicDocument[]> {
    logger.info('[MusicService] Hole alle Musik-Einträge');
    await connectDB();
    const music = await Music.find().select('-audioData').sort({ createdAt: -1 });
    logger.info('[MusicService] Gefundene Einträge:', music.length);
    return music;
  }

  /**
   * Lädt ein Bild von einer URL herunter und gibt Buffer und Mime-Type zurück
   */
  private static async downloadImageAsBuffer(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fehler beim Laden des Bildes: ${response.statusText}`);
      }
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), mimeType };
    } catch (error) {
      logger.error('[MusicService] Fehler beim Herunterladen des Coverarts:', error);
      throw error;
    }
  }

  public static async addMusic(url: string): Promise<{ url: string; trackInfo: TrackInfo }> {
    logger.info('[MusicService] Starte Prozess zum Hinzufügen neuer Musik:', url);
    if (!url || !this.isValidUrl(url)) {
      logger.error('[MusicService] Ungültige URL:', url);
      throw new Error('Ungültige URL');
    }
    try {
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
        logger.info('[MusicService] Aufgelöste URL:', url);
      }
      logger.debug('[MusicService] Hole Track-Informationen...');
      const trackInfo = await this.getTrackInfo(url);
      logger.info('[MusicService] Track-Info erfolgreich erhalten:', trackInfo);
      logger.debug('[MusicService] Starte Audio-Download...');
      const { buffer, mimeType } = await this.downloadAudio(url);
      logger.info('[MusicService] Audio erfolgreich heruntergeladen, Größe:', buffer.length, 'Bytes');

      // Coverart herunterladen
      let coverArtData: Buffer | undefined = undefined;
      let coverArtMimeType: string | undefined = undefined;
      logger.info('[MusicService] Coverart-URL:', trackInfo.thumbnail_url);
      if (trackInfo.thumbnail_url) {
        try {
          logger.info('[MusicService] Versuche Coverart zu laden:', trackInfo.thumbnail_url);
          const response = await fetch(trackInfo.thumbnail_url);
          logger.info('[MusicService] HTTP-Status Coverart:', response.status);
          if (!response.ok) {
            throw new Error(`Fehler beim Laden des Bildes: ${response.statusText}`);
          }
          coverArtMimeType = response.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await response.arrayBuffer();
          coverArtData = Buffer.from(arrayBuffer);
          logger.info('[MusicService] Coverart erfolgreich heruntergeladen, Größe:', coverArtData.length, 'Bytes, Mime-Type:', coverArtMimeType);
        } catch (coverError) {
          logger.error('[MusicService] Fehler beim Herunterladen des Coverarts:', coverError);
        }
      } else {
        logger.warn('[MusicService] Kein Coverart-URL gefunden');
      }

      logger.debug('[MusicService] Verbinde mit Datenbank...');
      await connectDB();
      logger.debug('[MusicService] Speichere Musik in Datenbank mit Feldern:', {
        url,
        trackInfo,
        audioData: buffer ? `[Buffer: ${buffer.length} Bytes]` : undefined,
        mimeType,
        coverArtData: coverArtData ? `[Buffer: ${coverArtData.length} Bytes]` : undefined,
        coverArtMimeType
      });
      const result = await Music.findOneAndUpdate(
        { url },
        {
          $set: {
            url,
            trackInfo,
            audioData: buffer,
            mimeType,
            coverArtData,
            coverArtMimeType
          }
        },
        { upsert: true, new: true }
      );
      logger.info('[MusicService] Musik erfolgreich in Datenbank gespeichert:', {
        id: result._id,
        url: result.url,
        hasAudioData: !!result.audioData,
        audioDataLength: result.audioData?.length,
        mimeType: result.mimeType,
        hasCoverArt: !!result.coverArtData,
        coverArtDataLength: result.coverArtData?.length,
        coverArtMimeType: result.coverArtMimeType
      });
      return {
        url: result.url,
        trackInfo: result.trackInfo && typeof result.trackInfo.toObject === 'function'
          ? result.trackInfo.toObject()
          : JSON.parse(JSON.stringify(result.trackInfo))
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('[MusicService] Fehler beim Hinzufügen der Musik:', error.message);
        logger.error('[MusicService] Stack Trace:', error.stack);
      } else {
        logger.error('[MusicService] Fehler beim Hinzufügen der Musik:', String(error));
      }
      throw error;
    }
  }

  public static async removeMusic(url: string): Promise<void> {
    logger.info('[MusicService] Entferne Musik:', url);
    await connectDB();
    const result = await Music.deleteOne({ url });
    logger.info('[MusicService] Lösch-Ergebnis:', result);
  }

  public static async removeMusicById(id: string): Promise<void> {
    logger.info('[MusicService] Entferne Musik anhand der ID:', id);
    await connectDB();
    const result = await Music.deleteOne({ _id: id });
    logger.info('[MusicService] Lösch-Ergebnis:', result);
  }

  public static async getAllTrackUrls(): Promise<string[]> {
    await connectDB();
    const docs = await Music.find({}, { url: 1, _id: 0 });
    return docs.map((doc: { url: string }) => doc.url);
  }
} 