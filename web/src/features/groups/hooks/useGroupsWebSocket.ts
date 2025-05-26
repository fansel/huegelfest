"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import { fetchGroupsData, type GroupsData } from '../actions/fetchGroupsData';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';

type GroupsWebSocketEventType = 
  | 'groups-updated'
  | 'group-created' 
  | 'group-updated' 
  | 'group-deleted'
  | 'user-assigned'
  | 'user-removed'
  | 'user-deleted'
  | 'registration-updated';

/**
 * Hook für Echtzeit-Synchronisation der Groups-Daten über die bestehende WebSocket-Infrastruktur
 * Folgt dem Muster von useTimelineWebSocket
 */
export function useGroupsWebSocket() {
  const [data, setData] = useState<GroupsData>({
    groups: [],
    statistics: null,
    users: [],
    registrations: []
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Echten WebSocket-Status vom globalen Manager abfragen
  const updateConnectionStatus = useCallback(() => {
    const status = globalWebSocketManager.getStatus();
    setConnected(status.connected);
  }, []);

  // Status-Updates alle 2 Sekunden prüfen (falls Callbacks nicht funktionieren)
  useEffect(() => {
    updateConnectionStatus(); // Sofort prüfen
    const interval = setInterval(updateConnectionStatus, 2000);
    return () => clearInterval(interval);
  }, [updateConnectionStatus]);

  // Initiale Daten laden
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const initialData = await fetchGroupsData();
      setData(initialData);
    } catch (error) {
      console.error('[useGroupsWebSocket] Fehler beim Laden der initial Daten:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  // Daten vollständig neu laden (fallback für komplexe Updates)
  const refreshData = useCallback(async () => {
    try {
      console.log('[useGroupsWebSocket] Starte Datenaktualisierung...');
      const freshData = await fetchGroupsData();
      console.log('[useGroupsWebSocket] Neue Daten erhalten:', {
        groupsCount: freshData.groups.length,
        usersCount: freshData.users.length,
        usersWithGroups: freshData.users.filter(u => u.groupId).length,
        userSample: freshData.users.slice(0, 3).map(u => ({ name: u.name, groupId: u.groupId }))
      });
      setData(freshData);
    } catch (error) {
      console.error('[useGroupsWebSocket] Fehler beim Aktualisieren der Daten:', error);
      toast.error('Fehler beim Aktualisieren der Daten');
    }
  }, []);

  // WebSocket Message Handler - Nur Updates, keine Toast-Messages
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    console.log('[useGroupsWebSocket] WebSocket-Nachricht empfangen:', msg);

    // Prüfe auf groups-bezogene Topics
    if (msg.topic === 'groups-updated' || 
        msg.topic === 'group-created' || 
        msg.topic === 'group-updated' || 
        msg.topic === 'group-deleted' ||
        msg.topic === 'user-assigned' ||
        msg.topic === 'user-removed' ||
        msg.topic === 'user-deleted' ||
        msg.topic === 'registration-updated') {
      
      console.log('[useGroupsWebSocket] Groups-Update erkannt, lade Daten neu');
      refreshData();

      // Keine Toast-Messages bei WebSocket-Updates von anderen Admins
      // Toast-Messages werden nur in den Dialog-Callbacks gezeigt
    }
  }, [refreshData]);

  // WebSocket-Verbindung mit bestehender Infrastruktur
  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: handleWebSocketMessage,
      onOpen: () => {
        updateConnectionStatus(); // Status sofort aktualisieren
        console.log('[useGroupsWebSocket] WebSocket verbunden');
      },
      onClose: () => {
        updateConnectionStatus(); // Status sofort aktualisieren
        console.log('[useGroupsWebSocket] WebSocket getrennt');
      },
      onError: (err) => {
        console.error('[useGroupsWebSocket] WebSocket-Fehler:', err);
        updateConnectionStatus(); // Status sofort aktualisieren
      },
      reconnectIntervalMs: 5000,
    }
  );

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