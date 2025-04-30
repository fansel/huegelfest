import { connectDB } from '@/db/config/connector';
import Music, { MusicDocument } from '@/db/models/Music';
import { logger } from '@/lib/logger';

export class MusicService {
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
  
  

  private static async getTrackInfo(url: string): Promise<any> {
    logger.debug('[MusicService] Hole Track-Info für URL:', url);
    try {
      if (url.includes('on.soundcloud.com')) {
        url = await this.resolveShortUrl(url);
      }
      
      logger.debug('[MusicService] Rufe oEmbed-API auf für:', url);
      const response = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[MusicService] oEmbed-API Fehler:', errorText);
        throw new Error(`Fehler beim Abrufen der Track-Informationen: ${errorText}`);
      }

      const data = await response.json();
      logger.debug('[MusicService] Erhaltene Track-Info:', data);
      return data;
    } catch (error) {
      logger.error('[MusicService] Fehler beim Abrufen der Track-Informationen:', error);
      throw error;
    }
  }

  public static async getAllMusic(): Promise<MusicDocument[]> {
    logger.info('[MusicService] Hole alle Musik-Einträge');
    await connectDB();
    const music = await Music.find().sort({ createdAt: -1 });
    logger.info('[MusicService] Gefundene Einträge:', music.length);
    return music;
  }

  public static async addMusic(url: string): Promise<MusicDocument> {
    logger.info('[MusicService] Füge neue Musik hinzu:', url);
    if (!url || !this.isValidUrl(url)) {
      logger.error('[MusicService] Ungültige URL:', url);
      throw new Error('Ungültige URL');
    }

    // Auflösen der URL, falls es sich um eine kurze URL handelt
    if (url.includes('on.soundcloud.com')) {
      url = await this.resolveShortUrl(url);
      logger.info('[MusicService] Aufgelöste URL:', url);
    }

    const trackInfo = await this.getTrackInfo(url);
    logger.info('[MusicService] Speichere Musik in Datenbank');
    
    await connectDB();
    const result = await Music.findOneAndUpdate(
      { url },
      { url, trackInfo },
      { upsert: true, new: true }
    );
    logger.info('[MusicService] Musik erfolgreich gespeichert:', result);
    return result;
  }

  public static async removeMusic(url: string): Promise<void> {
    logger.info('[MusicService] Entferne Musik:', url);
    await connectDB();
    const result = await Music.deleteOne({ url });
    logger.info('[MusicService] Lösch-Ergebnis:', result);
  }
} 