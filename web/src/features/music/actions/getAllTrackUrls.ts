"use server";

import { MusicService } from '../service/MusicService';

export async function getAllTrackUrls(): Promise<string[]> {
  return MusicService.getAllTrackUrls();
} 