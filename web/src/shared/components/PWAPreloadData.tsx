'use client';

import { useEffect } from 'react';
import { fetchTimeline } from '@/features/timeline/actions/fetchTimeline';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import { mutate } from 'swr';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Preload-Komponente für kritische Daten der PWA.
 * Wird sofort beim App-Start geladen und stellt sicher, dass wichtige Daten
 * für den Offline-Modus verfügbar sind.
 */
export function PWAPreloadData() {
  const isOnline = useNetworkStatus();
  
  // Beim ersten Laden wichtige Daten SOFORT in den SWR-Cache laden
  useEffect(() => {
    if (isOnline && typeof window !== 'undefined') {
      const preloadCriticalData = async () => {
        try {
          console.log('[PWA] Starte SOFORTIGES Preload kritischer Daten...');
          
          // Alle Daten parallel laden für bessere Performance
          const [timelineData, announcements, packlistItems] = await Promise.allSettled([
            fetchTimeline(),
            getAllAnnouncementsAction(),
            getGlobalPacklistAction()
          ]);
          
          // Timeline-Daten (wichtigste Daten)
          if (timelineData.status === 'fulfilled') {
            mutate('timeline', timelineData.value, false);
            console.log('[PWA] Timeline-Daten erfolgreich vorgeladen');
          } else {
            console.error('[PWA] Fehler beim Vorladen der Timeline:', timelineData.reason);
          }
          
          // Ankündigungen
          if (announcements.status === 'fulfilled') {
            mutate(['infoboard', null], { announcements: announcements.value, reactionsMap: {} }, false);
            console.log('[PWA] Ankündigungen erfolgreich vorgeladen');
          } else {
            console.error('[PWA] Fehler beim Vorladen der Ankündigungen:', announcements.reason);
          }
          
          // Packliste
          if (packlistItems.status === 'fulfilled') {
            mutate('packlist-data', packlistItems.value, false);
            console.log('[PWA] Packliste erfolgreich vorgeladen');
          } else {
            console.error('[PWA] Fehler beim Vorladen der Packliste:', packlistItems.reason);
          }
          
          console.log('[PWA] Preload kritischer Daten abgeschlossen');
        } catch (error) {
          console.error('[PWA] Fehler beim Vorladen kritischer Daten:', error);
        }
      };
      
      // SOFORT ausführen, keine Verzögerung mehr
      preloadCriticalData();
    }
  }, [isOnline]);
  
  return null;
} 