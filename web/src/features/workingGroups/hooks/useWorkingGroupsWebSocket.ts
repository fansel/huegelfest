"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import { getWorkingGroupsArrayAction } from '../actions/getWorkingGroupColors';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';

type WorkingGroupsWebSocketEventType = 
  | 'working-groups-updated'
  | 'working-group-created' 
  | 'working-group-updated' 
  | 'working-group-deleted';

export interface WorkingGroup {
  id: string;
  name: string;
  color: string;
}

export interface WorkingGroupsData {
  workingGroups: WorkingGroup[];
}

/**
 * Hook für Echtzeit-Synchronisation der WorkingGroups-Daten über WebSockets
 * Folgt dem Muster von useGroupsWebSocket
 */
export function useWorkingGroupsWebSocket() {
  const [data, setData] = useState<WorkingGroupsData>({
    workingGroups: []
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Echten WebSocket-Status vom globalen Manager abfragen
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
    setLoading(true);
    try {
      const workingGroups = await getWorkingGroupsArrayAction();
      setData({ workingGroups });
    } catch (error) {
      console.error('[useWorkingGroupsWebSocket] Fehler beim Laden der initial Daten:', error);
      toast.error('Fehler beim Laden der WorkingGroups-Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  // Daten vollständig neu laden
  const refreshData = useCallback(async () => {
    try {
      console.log('[useWorkingGroupsWebSocket] Starte Datenaktualisierung...');
      const workingGroups = await getWorkingGroupsArrayAction();
      console.log('[useWorkingGroupsWebSocket] Neue Daten erhalten:', {
        workingGroupsCount: workingGroups.length
      });
      setData({ workingGroups });
    } catch (error) {
      console.error('[useWorkingGroupsWebSocket] Fehler beim Aktualisieren der Daten:', error);
      toast.error('Fehler beim Aktualisieren der WorkingGroups-Daten');
    }
  }, []);

  // WebSocket Message Handler - Nur Updates, keine Toast-Messages
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    console.log('[useWorkingGroupsWebSocket] WebSocket-Nachricht empfangen:', msg);

    // Prüfe auf working-groups-bezogene Topics
    if (msg.topic === 'working-groups-updated' || 
        msg.topic === 'working-group-created' || 
        msg.topic === 'working-group-updated' || 
        msg.topic === 'working-group-deleted') {
      
      console.log('[useWorkingGroupsWebSocket] WorkingGroups-Update erkannt, lade Daten neu');
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
        updateConnectionStatus();
        console.log('[useWorkingGroupsWebSocket] WebSocket verbunden');
      },
      onClose: () => {
        updateConnectionStatus();
        console.log('[useWorkingGroupsWebSocket] WebSocket getrennt');
      },
      onError: (err) => {
        console.error('[useWorkingGroupsWebSocket] WebSocket-Fehler:', err);
        updateConnectionStatus();
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