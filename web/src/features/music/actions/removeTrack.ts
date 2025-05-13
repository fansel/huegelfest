"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';

export async function removeTrack(url: string): Promise<void> {
  try {
    await MusicService.removeMusic(url);
  } catch (error) {
    logger.error('[removeTrack] Fehler beim Entfernen:', error);
    throw new Error('Fehler beim Entfernen der Musik');
  }
} 