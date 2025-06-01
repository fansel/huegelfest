"use client";

import { useState, useEffect } from 'react';

interface UseFestivalDaysReturn {
  festivalDays: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook für Client-Komponenten zum Laden der zentralen Festival-Tage
 * Verwendet direkt die festen Festival-Tage (da diese sich nie ändern)
 */
export function useFestivalDays(): UseFestivalDaysReturn {
  const [festivalDays] = useState<string[]>(FESTIVAL_DAYS_FALLBACK);
  const [loading] = useState(false); // Sofort false, da keine Abfrage nötig
  const [error] = useState<string | null>(null);

  // Keine useEffect mehr nötig - Daten sind sofort verfügbar

  return {
    festivalDays,
    loading,
    error
  };
}

/**
 * Statische Festival-Tage - werden direkt verwendet
 */
export const FESTIVAL_DAYS_FALLBACK = ["31.07.", "01.08.", "02.08.", "03.08."]; 