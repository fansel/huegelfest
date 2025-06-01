import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { fetchActivitiesData, type ActivitiesData } from '../actions/fetchActivitiesData';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

type ActivitiesEvent = {
  type: 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED' | 'ACTIVITY_DELETED' | 'ACTIVITY_CATEGORY_CREATED' | 'ACTIVITY_CATEGORY_UPDATED' | 'ACTIVITY_CATEGORY_DELETED';
  data: any;
  timestamp: string;
};

/**
 * Hook für Echtzeit-Synchronisation der Activities-Daten über das globale WebSocket-System
 * Folgt dem exakten Pattern von useGroupsWebSocket
 */
export function useActivitiesRealtime(initialData?: ActivitiesData) {
  const [data, setData] = useState<ActivitiesData>(initialData || {
    activities: [],
    categories: [],
    templates: [],
    groups: []
  });
  const [loading, setLoading] = useState(!initialData); // No loading if initial data provided
  const [connected, setConnected] = useState(false);
  const isOnline = useNetworkStatus();

  // WebSocket-Status vom globalen Manager abfragen
  const updateConnectionStatus = useCallback(() => {
    const status = globalWebSocketManager.getStatus();
    setConnected(status.connected);
  }, []);

  // Status-Updates alle 2 Sekunden prüfen
  useEffect(() => {
    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 2000);
    return () => clearInterval(interval);
  }, [updateConnectionStatus]);

  // Initiale Daten laden - nur wenn keine initial data bereitgestellt
  const loadInitialData = useCallback(async () => {
    if (initialData) return; // Skip if initial data provided
    
    setLoading(true);
    try {
      const freshData = await fetchActivitiesData();
      setData(freshData);
    } catch (error) {
      console.error('[useActivitiesRealtime] Fehler beim Laden der initial Daten:', error);
      if (isOnline) {
        toast.error('Fehler beim Laden der Activities-Daten');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, initialData]);

  // Daten vollständig neu laden (fallback für komplexe Updates)
  const refreshData = useCallback(async () => {
    try {
      console.log('[useActivitiesRealtime] Starte Datenaktualisierung...');
      const freshData = await fetchActivitiesData();
      console.log('[useActivitiesRealtime] Neue Daten erhalten:', {
        activitiesCount: freshData.activities.length,
        categoriesCount: freshData.categories.length,
        templatesCount: freshData.templates.length,
        groupsCount: freshData.groups.length
      });
      setData(freshData);
    } catch (error) {
      console.error('[useActivitiesRealtime] Fehler beim Aktualisieren der Daten:', error);
      if (isOnline) {
        toast.error('Fehler beim Aktualisieren der Activities-Daten');
      }
    }
  }, [isOnline]);

  // WebSocket Message Handler - verwendet globales System
  const handleWebSocketMessage = useCallback((msg: any) => {
    console.log('[useActivitiesRealtime] WebSocket-Nachricht empfangen:', msg);

    // Prüfe auf activities-bezogene Topics
    if (msg.topic === 'ACTIVITY_CREATED' || 
        msg.topic === 'ACTIVITY_UPDATED' || 
        msg.topic === 'ACTIVITY_DELETED' ||
        msg.topic === 'ACTIVITY_CATEGORY_CREATED' ||
        msg.topic === 'ACTIVITY_CATEGORY_UPDATED' ||
        msg.topic === 'ACTIVITY_CATEGORY_DELETED') {
      
      console.log('[useActivitiesRealtime] Activities-Update erkannt, lade Daten neu');
      refreshData();

      // Keine Toast-Messages bei WebSocket-Updates von anderen Admins
      // Toast-Messages werden nur in den Dialog-Callbacks gezeigt
    }
  }, [refreshData]);

  // Globales WebSocket-System verwenden
  useGlobalWebSocket({
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      updateConnectionStatus();
      console.log('[useActivitiesRealtime] Global WebSocket verbunden');
    },
    onClose: () => {
      updateConnectionStatus();
      console.log('[useActivitiesRealtime] Global WebSocket getrennt');
    },
    onError: (err) => {
      console.error('[useActivitiesRealtime] Global WebSocket-Fehler:', err);
      updateConnectionStatus();
    },
    // Topic-Filter für Activities-relevante Events
    topicFilter: [
      'ACTIVITY_CREATED',
      'ACTIVITY_UPDATED', 
      'ACTIVITY_DELETED',
      'ACTIVITY_CATEGORY_CREATED',
      'ACTIVITY_CATEGORY_UPDATED',
      'ACTIVITY_CATEGORY_DELETED'
    ]
  });

  // Initiale Daten beim Mount laden
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    data,
    loading,
    connected,
    refreshData
  };
} 