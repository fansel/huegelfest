import { connectDB } from '@/lib/db/connector';
import Music, { MusicDocument, TrackInfo } from '@/lib/db/models/Music';
import { logger } from '@/lib/logger';
import scdl from 'soundcloud-downloader';

export class MusicService {
  private static clientId: string;

  private static getClientId(): string {
    if (!this.clientId) {
      this.clientId = process.env.SOUNDCLOUD_CLIENT_ID || '';
      if (!this.clientId) {
        logger.error('[MusicService] SOUNDCLOUD_CLIENT_ID nicht gefunden in Umgebungsvariablen');
        throw new Error('SOUNDCLOUD_CLIENT_ID ist nicht in den Umgebungsvariablen definiert');
      }
      logger.info('[MusicService] Client-ID erfolgreich geladen');
    }
    return this.clientId;
  }

  private static isValidUrl(url: string): boolean {
    logger.debug('[MusicService] Überprüfe URL:', url);
    try {
      if (url.includes('on.soundcloud.com')) {
        logger.debug('[MusicService] URL ist eine SoundCloud-URL');
        return true;
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
      const clientId = this.getClientId();
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
        logger.info('[MusicService] Aufgelöste URL:', url);
      }
      const trackInfo = await scdl.getInfo(url);
      logger.debug('[MusicService] SoundCloud Track-Info erhalten:', trackInfo);
      if (!trackInfo || !trackInfo.title) {
        throw new Error('Ungültige Track-Informationen von SoundCloud');
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
        throw new Error(`Fehler beim Abrufen der Track-Informationen: ${error.message}`);
      }
      throw new Error('Unbekannter Fehler beim Abrufen der Track-Informationen');
    }
  }

  private static async downloadAudio(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    logger.debug('[MusicService] Starte Audio-Download für URL:', url);
    try {
      const clientId = this.getClientId();
      logger.info('[MusicService] Verwende Client-ID:', clientId);
      logger.debug('[MusicService] Hole SoundCloud Track-Info...');
      const trackInfo = await scdl.getInfo(url);
      logger.debug('[MusicService] SoundCloud Track-Info erhalten:', trackInfo);
      logger.debug('[MusicService] Initialisiere Download...');
      const stream = await scdl.download(url);
      logger.info('[MusicService] Download-Stream erfolgreich erstellt');
      logger.debug('[MusicService] Konvertiere Stream zu Buffer...');
      const chunks: Buffer[] = [];
      let chunkCount = 0;
      let totalBytes = 0;
      for await (const chunk of stream) {
        const buffer = Buffer.from(chunk);
        chunks.push(buffer);
        chunkCount++;
        totalBytes += buffer.length;
        if (chunkCount % 10 === 0) {
          logger.debug(`[MusicService] ${chunkCount} Chunks verarbeitet, ${totalBytes} Bytes`);
        }
      }
      const buffer = Buffer.concat(chunks);
      logger.info(`[MusicService] Download abgeschlossen. ${chunkCount} Chunks, ${buffer.length} Bytes`);
      if (buffer.length === 0) {
        logger.error('[MusicService] Download-Stream war leer');
        throw new Error('Download-Stream war leer');
      }
      return {
        buffer,
        mimeType: 'audio/mpeg'
      };
    } catch (error) {
      logger.error('[MusicService] Fehler beim Herunterladen der Audio-Datei:', error);
      if (error instanceof Error) {
        logger.error('[MusicService] Fehlerdetails:', error.message);
        logger.error('[MusicService] Stack Trace:', error.stack);
      }
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