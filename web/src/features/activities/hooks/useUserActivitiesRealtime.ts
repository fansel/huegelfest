import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { fetchUserActivitiesAction, type UserActivitiesData } from '../actions/fetchUserActivities';

/**
 * Hook für Echtzeit-Synchronisation der Benutzer-Aufgaben über das globale WebSocket-System
 * Folgt dem exakten Pattern von useGroupsWebSocket
 */
export function useUserActivitiesRealtime(deviceId: string | null) {
  const [data, setData] = useState<UserActivitiesData>({
    activities: [],
    userStatus: { isRegistered: false }
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

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

  // Initiale Daten laden
  const loadInitialData = useCallback(async () => {
    if (!deviceId) return;
    
    setLoading(true);
    try {
      const initialData = await fetchUserActivitiesAction(deviceId);
      setData(initialData);
    } catch (error) {
      console.error('[useUserActivitiesRealtime] Fehler beim Laden der Benutzer-Aufgaben:', error);
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Daten vollständig neu laden (fallback)
  const refreshData = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      const freshData = await fetchUserActivitiesAction(deviceId);
      setData(freshData);
    } catch (error) {
      console.error('[useUserActivitiesRealtime] Fehler beim Aktualisieren der Benutzer-Aufgaben:', error);
      toast.error('Fehler beim Aktualisieren der Aufgaben');
    }
  }, [deviceId]);

  // WebSocket Message Handler - verwendet globales System
  const handleWebSocketMessage = useCallback((msg: any) => {
    console.log('[useUserActivitiesRealtime] WebSocket-Nachricht empfangen:', msg);

    // Only handle events relevant to the user's group or general activity events
    if (msg.topic === 'ACTIVITY_CREATED' || 
        msg.topic === 'ACTIVITY_UPDATED' || 
        msg.topic === 'ACTIVITY_DELETED' ||
        msg.topic === 'group-updated' ||
        msg.topic === 'user-assigned' ||
        msg.topic === 'user-removed') {
      
      console.log('[useUserActivitiesRealtime] User Activities-Update erkannt, lade Daten neu');
      refreshData();

      // Show user-friendly notifications
      if (msg.topic === 'ACTIVITY_CREATED' && data.userStatus.groupId) {
        toast.success('Neue Aufgabe für deine Gruppe!');
      } else if (msg.topic === 'ACTIVITY_UPDATED' && data.userStatus.groupId) {
        toast.success('Aufgabe wurde aktualisiert');
      } else if (msg.topic === 'ACTIVITY_DELETED') {
        toast.success('Aufgabe wurde entfernt');
      }
    }
  }, [refreshData, data.userStatus.groupId]);

  // Globales WebSocket-System verwenden
  useGlobalWebSocket({
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      updateConnectionStatus();
      console.log('[useUserActivitiesRealtime] Global WebSocket verbunden');
    },
    onClose: () => {
      updateConnectionStatus();
      console.log('[useUserActivitiesRealtime] Global WebSocket getrennt');
    },
    onError: (err) => {
      console.error('[useUserActivitiesRealtime] Global WebSocket-Fehler:', err);
      updateConnectionStatus();
    },
    // Topic-Filter für User-relevante Events
    topicFilter: [
      'ACTIVITY_CREATED',
      'ACTIVITY_UPDATED', 
      'ACTIVITY_DELETED',
      'group-updated',
      'user-assigned',
      'user-removed'
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