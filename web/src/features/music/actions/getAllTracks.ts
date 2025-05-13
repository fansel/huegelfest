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
}

export async function getAllTracks(): Promise<MusicEntry[]> {
  try {
    const music = await MusicService.getAllMusic();
    return music.map((entry: any) => ({
      _id: entry._id?.toString?.() ?? entry._id,
      url: entry.url,
      trackInfo: entry.trackInfo
    }));
  } catch (error) {
    logger.error('[getAllTracks] Fehler beim Laden der Musik:', error);
    throw new Error('Fehler beim Laden der Musik');
  }
} 