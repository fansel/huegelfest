"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';

export interface TrackInfo {
  title: string;
  author_name: string;
  thumbnail_url: string;
  author_url: string;
  description: string;
  html: string;
}

export interface MusicEntry {
  _id: string;
  url: string;
  trackInfo: TrackInfo;
  coverArtData?: string; // Base64
  coverArtMimeType?: string;
}

export async function getAllTracks(): Promise<MusicEntry[]> {
  try {
    const music = await MusicService.getAllMusic();
    return music.map((entry: any) => ({
      _id: entry._id?.toString?.() ?? entry._id,
      url: `/api/music/stream?id=${encodeURIComponent(entry._id?.toString?.() ?? entry._id)}`,
      trackInfo: entry.trackInfo && typeof entry.trackInfo.toObject === 'function'
        ? entry.trackInfo.toObject()
        : JSON.parse(JSON.stringify(entry.trackInfo)),
      coverArtData: entry.coverArtData ? entry.coverArtData.toString('base64') : undefined,
      coverArtMimeType: entry.coverArtMimeType
    }));
  } catch (error) {
    logger.error('[getAllTracks] Fehler beim Laden der Musik:', error);
    throw new Error('Fehler beim Laden der Musik');
  }
} 