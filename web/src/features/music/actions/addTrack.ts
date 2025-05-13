"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';
import { MusicEntry } from './getAllTracks';

export async function addTrack(url: string): Promise<MusicEntry> {
  try {
    const result = await MusicService.addMusic(url);
    return {
      url: result.url,
      trackInfo: result.trackInfo
    };
  } catch (error) {
    logger.error('[addTrack] Fehler beim Hinzufügen:', error);
    throw new Error('Fehler beim Hinzufügen der Musik');
  }
} 