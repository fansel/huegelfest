"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import useSWR from 'swr';

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

const DEBUG = false;

/**
 * Hook für Echtzeit-Synchronisation der WorkingGroups-Daten über WebSockets
 * Folgt dem Muster von useGroupsWebSocket
 */
export function useWorkingGroupsWebSocket() {
  const { data, mutate } = useSWR<WorkingGroupsData>('/api/working-groups');
  const [connected, setConnected] = useState(false);

  const updateData = useCallback(async () => {
    if (DEBUG) {
      console.log('[useWorkingGroupsWebSocket] Aktualisiere Daten...');
    }
    
    try {
      await mutate();
      
      if (DEBUG) {
        console.log('[useWorkingGroupsWebSocket] Daten erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('[useWorkingGroupsWebSocket] Fehler beim Aktualisieren:', error);
    }
  }, [mutate]);

  // WebSocket-Verbindung mit globalem WebSocket System
  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      if (DEBUG) {
        console.log('[useWorkingGroupsWebSocket] WebSocket-Nachricht:', msg);
      }

      if (msg.topic === 'working-groups-update') {
        updateData();
      }
    },
    onOpen: () => {
      setConnected(true);
      if (DEBUG) {
        console.log('[useWorkingGroupsWebSocket] Verbunden');
      }
    },
    onClose: () => {
      setConnected(false);
      if (DEBUG) {
        console.log('[useWorkingGroupsWebSocket] Getrennt');
      }
    },
    onError: (err) => {
      console.error('[useWorkingGroupsWebSocket] WebSocket-Fehler:', err);
      setConnected(false);
    },
    topicFilter: ['working-groups-update']
  });

  return { data, connected };
} 