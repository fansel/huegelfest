'use client';

import { useEffect } from 'react';
import { fetchTimeline } from '@/features/timeline/actions/fetchTimeline';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import { mutate } from 'swr';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Preload-Komponente für kritische Daten der PWA.
 * Wird am Anfang der App geladen und stellt sicher, dass wichtige Daten
 * für den Offline-Modus verfügbar sind.
 */
export function PWAPreloadData() {
  const isOnline = useNetworkStatus();
  
  // Beim ersten Laden wichtige Daten in den SWR-Cache laden
  useEffect(() => {
    if (isOnline && typeof window !== 'undefined') {
      const preloadCriticalData = async () => {
        try {
          console.log('[PWA] Starte Preload kritischer Daten...');
          
          // 1. Timeline-Daten vorladen (wichtigste Daten)
          const timelineData = await fetchTimeline();
          mutate('timeline', timelineData, false);
          console.log('[PWA] Timeline-Daten erfolgreich vorgeladen');
          
          // 2. Ankündigungen vorladen
          const announcements = await getAllAnnouncementsAction();
          mutate(['infoboard', null], { announcements, reactionsMap: {} }, false);
          console.log('[PWA] Ankündigungen erfolgreich vorgeladen');
          
          // 3. Packliste vorladen
          const packlistItems = await getGlobalPacklistAction();
          mutate('packlist-data', packlistItems, false);
          console.log('[PWA] Packliste erfolgreich vorgeladen');
          
          console.log('[PWA] Preload kritischer Daten abgeschlossen');
        } catch (error) {
          console.error('[PWA] Fehler beim Vorladen kritischer Daten:', error);
        }
      };
      
      // Mit kurzer Verzögerung ausführen, um die App-Start-Performance nicht zu beeinträchtigen
      const timer = setTimeout(() => {
        preloadCriticalData();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);
  
  return null;
} 