"use server";

import { logger } from '@/lib/logger';

export interface UrlValidationResult {
  isValid: boolean;
  errorMessage?: string;
  suggestion?: string;
}

export async function validateSoundCloudUrl(url: string): Promise<UrlValidationResult> {
  try {
    // Grundlegende URL-Validierung
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        errorMessage: 'Bitte gib eine gültige URL ein'
      };
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return {
        isValid: false,
        errorMessage: 'URL darf nicht leer sein'
      };
    }

    // Prüfe ob es eine SoundCloud URL ist
    if (!trimmedUrl.includes('soundcloud.com')) {
      return {
        isValid: false,
        errorMessage: 'Nur SoundCloud URLs werden unterstützt',
        suggestion: 'Nutze Links wie: https://soundcloud.com/artist/track-name'
      };
    }

    // Spezifische SoundCloud URL-Validierung
    const urlPatterns = {
      track: /soundcloud\.com\/[^\/]+\/[^\/]+(?:\?[^\/]*)?$/,
      shortUrl: /on\.soundcloud\.com\/\w+/,
      playlist: /soundcloud\.com\/[^\/]+\/sets\/[^\/]+/,
      profile: /^https?:\/\/(www\.)?soundcloud\.com\/[^\/]+\/?$/,
      discover: /soundcloud\.com\/(discover|charts|search)/,
    };

    // Prüfe auf unterstützte Formate
    if (urlPatterns.track.test(trimmedUrl) || urlPatterns.shortUrl.test(trimmedUrl)) {
      return { isValid: true };
    }

    // Spezifische Fehlermeldungen für verschiedene URL-Typen
    if (urlPatterns.playlist.test(trimmedUrl)) {
      return {
        isValid: false,
        errorMessage: 'Playlist-URLs werden nicht unterstützt',
        suggestion: 'Bitte nutze direkte Track-Links aus der Playlist'
      };
    }

    if (urlPatterns.profile.test(trimmedUrl)) {
      return {
        isValid: false,
        errorMessage: 'Profil-URLs werden nicht unterstützt',
        suggestion: 'Bitte nutze einen direkten Link zu einem Track'
      };
    }

    if (urlPatterns.discover.test(trimmedUrl)) {
      return {
        isValid: false,
        errorMessage: 'Discover/Charts-URLs werden nicht unterstützt',
        suggestion: 'Bitte nutze einen direkten Link zu einem Track'
      };
    }

    // URL scheint SoundCloud zu sein, aber Format unbekannt
    return {
      isValid: false,
      errorMessage: 'SoundCloud URL-Format wird nicht erkannt',
      suggestion: 'Unterstützt werden: Track-Links (z.B. soundcloud.com/artist/track-name) und Short-Links (on.soundcloud.com/...)'
    };

  } catch (error) {
    logger.error('[validateSoundCloudUrl] Fehler bei URL-Validierung:', error);
    return {
      isValid: false,
      errorMessage: 'Fehler bei der URL-Validierung'
    };
  }
} 