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

export async function getTrackInfos(urls: string[]): Promise<TrackInfo[]> {
  const results: TrackInfo[] = [];
  for (const url of urls) {
    try {
      const info = await MusicService.getTrackInfo(url);
      results.push(info);
    } catch (error) {
      logger.error(`[getTrackInfos] Fehler bei URL ${url}:`, error);
      // Optional: results.push({ ...Fallback-Objekt... })
    }
  }
  return results;
} 