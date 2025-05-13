"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';

export async function removeTrack(id: string): Promise<void> {
  try {
    await MusicService.removeMusicById(id);
  } catch (error) {
    logger.error('[removeTrack] Fehler beim Entfernen:', error);
    throw new Error('Fehler beim Entfernen der Musik');
  }
} 