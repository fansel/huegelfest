'use client';

import { useEffect } from 'react';
import { fetchTimeline } from '@/features/timeline/actions/fetchTimeline';
import { getAllAnnouncementsAction } from '@/features/announcements/actions/getAllAnnouncements';
import { getAnnouncementReactionsAction } from '@/features/announcements/actions/getAnnouncementReactions';
import { getGlobalPacklistAction } from '@/features/packlist/actions/getGlobalPacklistAction';
import { getRidesAction } from '@/features/registration/actions/getRides';
import { fetchUserActivitiesAction } from '@/features/admin/components/activities/actions/fetchUserActivities';
import { mutate } from 'swr';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useDeviceId } from '../hooks/useDeviceId';

/**
 * Preload-Komponente für kritische Daten der PWA.
 * Wird am Anfang der App geladen und stellt sicher, dass wichtige Daten
 * sofort für den Offline-Modus verfügbar sind.
 */
export function PWAPreloadData() {
  const { isOnline } = useNetworkStatus();
  const deviceId = useDeviceId();
  
  // Beim ersten Laden wichtige Daten sofort in den SWR-Cache laden
  useEffect(() => {
    if (isOnline && typeof window !== 'undefined') {
      const preloadCriticalData = async () => {
        try {
          console.log('[PWA] Starte sofortigen Preload kritischer Daten...');
          
          // 1. Timeline-Daten vorladen (wichtigste Daten)
          const timelineData = await fetchTimeline();
          mutate('timeline', timelineData, false);
          console.log('[PWA] Timeline-Daten erfolgreich vorgeladen');
          
          // 2. Ankündigungen vorladen
          const announcements = await getAllAnnouncementsAction();
          const mapped = announcements.map((a: any) => ({
            ...a,
            groupName: a.groupName ?? a.groupInfo?.name ?? '',
            groupColor: a.groupColor ?? a.groupInfo?.color ?? '#cccccc',
          }));
          
          // 3. Reactions für alle Announcements vorladen (mit und ohne Device-ID)
          const reactionsObj: Record<string, any> = {};
          if (deviceId) {
            await Promise.all(mapped.map(async (a) => {
              try {
                reactionsObj[a.id] = await getAnnouncementReactionsAction(a.id, deviceId);
              } catch (error) {
                console.warn(`[PWA] Fehler beim Laden von Reactions für ${a.id}:`, error);
                reactionsObj[a.id] = { counts: {}, userReaction: undefined };
              }
            }));
          }
          
          // InfoBoard-Daten mit korrektem Key cachen
          const infoboardData = { announcements: mapped, reactionsMap: reactionsObj };
          mutate(['infoboard', deviceId], infoboardData, false);
          // Fallback für null Device-ID
          mutate(['infoboard', null], infoboardData, false);
          console.log('[PWA] Ankündigungen und Reactions erfolgreich vorgeladen');
          
          // 4. Packliste vorladen
          const packlistItems = await getGlobalPacklistAction();
          mutate('packlist-data', packlistItems, false);
          console.log('[PWA] Packliste erfolgreich vorgeladen');
          
          // 5. Carpool-Daten vorladen
          try {
            const carpoolData = await getRidesAction();
            const validCarpoolData = Array.isArray(carpoolData) ? carpoolData : [];
            mutate('carpool-rides', validCarpoolData, false);
            console.log('[PWA] Carpool-Daten erfolgreich vorgeladen');
          } catch (error) {
            console.warn('[PWA] Fehler beim Laden der Carpool-Daten:', error);
            mutate('carpool-rides', [], false); // Fallback auf leeres Array
          }
          
          // 6. User Activities (Aufgaben) vorladen
          if (deviceId) {
            try {
              const userActivitiesData = await fetchUserActivitiesAction(deviceId);
              mutate(`user-activities-${deviceId}`, userActivitiesData, false);
              console.log('[PWA] User Activities (Aufgaben) erfolgreich vorgeladen');
            } catch (error) {
              console.warn('[PWA] Fehler beim Laden der User Activities:', error);
              mutate(`user-activities-${deviceId}`, { activities: [], userStatus: { isRegistered: false } }, false);
            }
          }
          
          console.log('[PWA] Sofortiger Preload aller kritischen Daten abgeschlossen');
        } catch (error) {
          console.error('[PWA] Fehler beim Vorladen kritischer Daten:', error);
        }
      };
      
      // Sofort ausführen ohne Verzögerung für optimales Offline-Verhalten
      preloadCriticalData();
    } else if (!isOnline) {
      console.log('[PWA] Offline-Modus: Überspringe Preload, verwende gecachte Daten');
    }
  }, [isOnline, deviceId]);
  
  return null;
} 