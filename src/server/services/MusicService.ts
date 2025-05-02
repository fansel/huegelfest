import { connectDB } from '@/database/config/connector';
import Music, { MusicDocument } from '@/database/models/Music';
import { logger } from '@/server/lib/logger';
import { create, TrackInfo as SCDLTrackInfo } from 'soundcloud-downloader';
import { FaMusic } from 'react-icons/fa';

interface TrackInfo {
  title: string;
  author_name: string;
  thumbnail_url: string;
  author_url: string;
  description: string;
  html: string;
}

export class MusicService {
  private static scdl = create({
    clientID: process.env.SOUNDCLOUD_CLIENT_ID,
    saveClientID: true,
  });

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
        redirect: 'follow',
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
      // Auflösen der URL, falls es sich um eine kurze URL handelt
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
        logger.info('[MusicService] Aufgelöste URL:', url);
      }

      // Hole Track-Info von SoundCloud
      const trackInfo = await this.scdl.getInfo(url);
      logger.debug('[MusicService] SoundCloud Track-Info erhalten:', trackInfo);

      if (!trackInfo || !trackInfo.title) {
        throw new Error('Ungültige Track-Informationen von SoundCloud');
      }

      // Formatiere die Track-Info in das erwartete Format
      return {
        title: trackInfo.title,
        author_name: trackInfo.user.username,
        thumbnail_url: trackInfo.artwork_url || trackInfo.user.avatar_url,
        author_url: `https://soundcloud.com/${trackInfo.user.username}`,
        description: trackInfo.description,
        html: trackInfo.embed_html,
      };
    } catch (error) {
      logger.error('[MusicService] Fehler beim Abrufen der Track-Info:', error);
      if (error instanceof Error) {
        throw new Error(`Fehler beim Abrufen der Track-Informationen: ${error.message}`);
      }
      throw new Error('Unbekannter Fehler beim Abrufen der Track-Informationen');
    }
  }

  private static async downloadAudio(
    url: string,
  ): Promise<{ buffer: Buffer; mimeType: string; soundcloudResponse: SCDLTrackInfo }> {
    logger.debug('[MusicService] Starte Audio-Download für URL:', url);
    try {
      logger.debug('[MusicService] Hole SoundCloud Track-Info...');
      const trackInfo = await this.scdl.getInfo(url);
      logger.debug('[MusicService] SoundCloud Track-Info erhalten:', trackInfo);

      logger.debug('[MusicService] Initialisiere Download...');
      const stream = await this.scdl.download(url);
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
          logger.debug(
            `[MusicService] ${chunkCount} Chunks verarbeitet, ${totalBytes} Bytes`,
          );
        }
      }

      const buffer = Buffer.concat(chunks);
      logger.info(
        `[MusicService] Download abgeschlossen. ${chunkCount} Chunks, ${buffer.length} Bytes`,
      );

      if (buffer.length === 0) {
        logger.error('[MusicService] Download-Stream war leer');
        throw new Error('Download-Stream war leer');
      }

      return {
        buffer,
        mimeType: 'audio/mpeg',
        soundcloudResponse: trackInfo,
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

  public static async addMusic(url: string): Promise<MusicDocument> {
    logger.info('[MusicService] Starte Prozess zum Hinzufügen neuer Musik:', url);
    if (!url || !this.isValidUrl(url)) {
      logger.error('[MusicService] Ungültige URL:', url);
      throw new Error('Ungültige URL');
    }

    try {
      // Auflösen der URL, falls es sich um eine kurze URL handelt
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
        logger.info('[MusicService] Aufgelöste URL:', url);
      }

      logger.debug('[MusicService] Hole Track-Informationen...');
      const trackInfo = await this.getTrackInfo(url);
      logger.info('[MusicService] Track-Info erfolgreich erhalten');

      logger.debug('[MusicService] Starte Audio-Download...');
      const { buffer, mimeType, soundcloudResponse } = await this.downloadAudio(url);
      logger.info('[MusicService] Audio erfolgreich heruntergeladen');

      logger.debug('[MusicService] Verbinde mit Datenbank...');
      await connectDB();

      logger.debug('[MusicService] Speichere Musik in Datenbank...');
      const result = await Music.findOneAndUpdate(
        { url },
        {
          url,
          trackInfo,
          audioData: buffer,
          mimeType,
          soundcloudResponse,
        },
        { upsert: true, new: true },
      );

      logger.info('[MusicService] Musik erfolgreich in Datenbank gespeichert:', {
        id: result._id,
        url: result.url,
        hasAudioData: !!result.audioData,
        audioDataLength: result.audioData?.length,
        mimeType: result.mimeType,
      });

      return result;
    } catch (error) {
      logger.error('[MusicService] Fehler beim Hinzufügen der Musik:', error);
      if (error instanceof Error) {
        logger.error('[MusicService] Fehlerdetails:', error.message);
        logger.error('[MusicService] Stack Trace:', error.stack);
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
}
