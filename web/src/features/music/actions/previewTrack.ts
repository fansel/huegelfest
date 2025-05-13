"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';
import { TrackInfo } from './getAllTracks';

export async function previewTrack(url: string): Promise<TrackInfo> {
  try {
    const info = await MusicService.getTrackInfo(url);
    return info;
  } catch (error) {
    logger.error('[previewTrack] Fehler bei Vorschau:', error);
    throw new Error('Fehler beim Laden der Vorschau');
  }
} 