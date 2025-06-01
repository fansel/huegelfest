"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';
import { MusicEntry } from './getAllTracks';
import { broadcast } from '@/lib/websocket/broadcast';
import { checkTrackAvailability } from './checkTrackAvailability';

export async function addTrack(url: string): Promise<MusicEntry> {
  try {
    // Erst Verfügbarkeit prüfen
    logger.info('[addTrack] Prüfe Track-Verfügbarkeit für:', url);
    const availability = await checkTrackAvailability(url);
    
    if (!availability.isAvailable) {
      logger.warn('[addTrack] Track ist nicht verfügbar:', availability.reason);
      throw new Error(`Track kann nicht hinzugefügt werden: ${availability.reason}`);
    }
    
    logger.info('[addTrack] Track ist verfügbar, starte Download...');
    const result = await MusicService.addMusic(url);
    const allTracks = await MusicService.getAllMusic();
    const newTrack = allTracks.find(t => t.url === result.url);
    if (newTrack) {
      await broadcast('music-new-track', {
        _id: newTrack._id?.toString?.() ?? String(newTrack._id),
        url: `/api/music/stream?id=${encodeURIComponent(newTrack._id?.toString?.() ?? String(newTrack._id))}`,
        trackInfo: typeof newTrack.trackInfo === 'object' && typeof (newTrack.trackInfo as any).toObject === 'function'
          ? (newTrack.trackInfo as any).toObject()
          : JSON.parse(JSON.stringify(newTrack.trackInfo)),
        coverArtData: newTrack.coverArtData ? newTrack.coverArtData.toString('base64') : undefined,
        coverArtMimeType: newTrack.coverArtMimeType
      });
    }
    return {
      _id: allTracks.find(t => t.url === result.url)?._id?.toString?.() ?? String(allTracks.find(t => t.url === result.url)?._id),
      url: result.url,
      trackInfo: result.trackInfo
    };
  } catch (error) {
    logger.error('[addTrack] Fehler beim Hinzufügen:', error);
    throw new Error('Fehler beim Hinzufügen der Musik');
  }
} 