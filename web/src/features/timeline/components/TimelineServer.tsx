import React from 'react';
import { fetchTimeline } from '../actions/fetchTimeline';
import type { Category, Day, Event } from '../types/types';
import TimelineClient from './TimelineClient';

interface TimelineServerProps {
  showFavoritesOnly?: boolean;
  allowClipboard?: boolean;
}

/**
 * Server-Komponente: Lädt alle Daten für die Timeline serverseitig und übergibt sie an die Client-Komponente.
 * Now uses the central festival days system.
 */
const TimelineServer: React.FC<TimelineServerProps> = async ({ showFavoritesOnly = false, allowClipboard = false }) => {
  try {
    const { days, categories } = await fetchTimeline();
    
    return (
      <TimelineClient
        days={days}
        categories={categories}
        showFavoritesOnly={showFavoritesOnly}
        allowClipboard={allowClipboard}
      />
    );
  } catch (error: any) {
    return <div className="text-red-500">Fehler beim Laden der Timeline: {error.message}</div>;
  }
};

export default TimelineServer;

export async function getTimelineData() {
  return await fetchTimeline();
} 