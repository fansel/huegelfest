"use server";

import { MusicService } from '../service/MusicService';
import { logger } from '@/lib/logger';

export interface TrackAvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  trackInfo?: {
    title: string;
    author_name: string;
    thumbnail_url: string;
    author_url: string;
    description: string;
    html: string;
  };
}

export async function checkTrackAvailability(url: string): Promise<TrackAvailabilityResult> {
  try {
    logger.info('[checkTrackAvailability] Prüfe Verfügbarkeit für URL:', url);
    const result = await MusicService.checkTrackAvailability(url);
    logger.info('[checkTrackAvailability] Ergebnis:', result);
    return result;
  } catch (error) {
    logger.error('[checkTrackAvailability] Fehler bei Verfügbarkeitsprüfung:', error);
    return {
      isAvailable: false,
      reason: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Verfügbarkeitsprüfung'
    };
  }
} 