"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
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
 * Mit verbesserter Stabilisierung für instabile Netzwerke
 */
export function useGroupsWebSocket(initialData?: GroupsData) {
  const [data, setData] = useState<GroupsData>(initialData || {
    groups: [],
    statistics: null,
    users: [],
    registrations: []
  });
  const [loading, setLoading] = useState(!initialData); // No loading if initial data provided
  const [connected, setConnected] = useState(false);
  
  // Refs für Debouncing und Stabilisierung
  const connectionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastConnectionStateRef = useRef<boolean | null>(null);
  const connectionStabilityCountRef = useRef(0);

  // Verbesserte Verbindungsstatusüberwachung mit Debouncing
  const updateConnectionStatus = useCallback(() => {
    const status = globalWebSocketManager.getStatus();
    const currentConnectionState = status.connected;
    
    // Wenn sich der Status geändert hat, beginne Stabilisierungsperiode
    if (lastConnectionStateRef.current !== currentConnectionState) {
      // Reset Zähler bei Statusänderung
      connectionStabilityCountRef.current = 0;
      lastConnectionStateRef.current = currentConnectionState;
      
      // Bestehenden Debounce-Timer löschen
      if (connectionDebounceRef.current) {
        clearTimeout(connectionDebounceRef.current);
      }
      
      // Stabilisierungsperiode: 3 aufeinanderfolgende gleiche Status-Checks
      connectionDebounceRef.current = setTimeout(() => {
        connectionStabilityCountRef.current += 1;
        
        // Nach 3 stabilen Checks (6 Sekunden) Status übernehmen
        if (connectionStabilityCountRef.current >= 3) {
          console.log(`[useGroupsWebSocket] Stabiler Verbindungsstatus erkannt: ${currentConnectionState}`);
          setConnected(currentConnectionState);
          connectionStabilityCountRef.current = 0;
        } else {
          // Weitere Überprüfung nach 2 Sekunden
          updateConnectionStatus();
        }
      }, 2000);
    } else {
      // Status ist gleich geblieben, erhöhe Stabilitätszähler
      connectionStabilityCountRef.current += 1;
      
      // Nach 3 aufeinanderfolgenden gleichen Checks Status übernehmen
      if (connectionStabilityCountRef.current >= 3) {
        if (connected !== currentConnectionState) {
          console.log(`[useGroupsWebSocket] Stabiler Verbindungsstatus bestätigt: ${currentConnectionState}`);
          setConnected(currentConnectionState);
        }
        connectionStabilityCountRef.current = 0;
      }
    }
  }, [connected]);

  // Status-Updates alle 5 Sekunden prüfen (reduziert von 2 Sekunden)
  useEffect(() => {
    updateConnectionStatus(); // Sofort prüfen
    const interval = setInterval(updateConnectionStatus, 5000);
    return () => {
      clearInterval(interval);
      if (connectionDebounceRef.current) {
        clearTimeout(connectionDebounceRef.current);
      }
    };
  }, [updateConnectionStatus]);

  // Initiale Daten laden - nur wenn keine initial data bereitgestellt
  const loadInitialData = useCallback(async () => {
    if (initialData) return; // Skip if initial data provided
    
    setLoading(true);
    try {
      const freshData = await fetchGroupsData();
      setData(freshData);
    } catch (error) {
      console.error('[useGroupsWebSocket] Fehler beim Laden der initial Daten:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }, [initialData]);

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

  // WebSocket-Verbindung mit globalem WebSocket System
  useGlobalWebSocket({
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      // Verbindung nur nach Stabilisierungsperiode als "connected" markieren
      console.log('[useGroupsWebSocket] WebSocket verbunden - warte auf Stabilisierung');
    },
    onClose: () => {
      // Sofortiges Offline-Signal nur bei WebSocket-Fehlern, nicht bei Netzwerkwechseln
      console.log('[useGroupsWebSocket] WebSocket getrennt - warte auf Stabilisierung');
    },
    onError: (err) => {
      console.error('[useGroupsWebSocket] WebSocket-Fehler:', err);
      // Bei Fehlern sofort als disconnected markieren
      setConnected(false);
    },
    topicFilter: [
      'groups-updated',
      'group-created',
      'group-updated',
      'group-deleted',
      'user-assigned',
      'user-removed',
      'user-deleted',
      'registration-updated'
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