"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import { getAllAnnouncementsAction } from '../actions/getAllAnnouncements';
import { getWorkingGroupsArrayAction } from '../../workingGroups/actions/getWorkingGroupColors';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { IAnnouncement } from '@/shared/types/types';

type AnnouncementsWebSocketEventType = 
  | 'announcement'
  | 'announcement-reaction'
  | 'announcement-reaction-updated'
  | 'announcements-updated';

export interface WorkingGroup {
  id: string;
  name: string;
  color: string;
}

export interface AnnouncementsData {
  announcements: IAnnouncement[];
  workingGroups: WorkingGroup[];
}

const DEBUG = false;

/**
 * Hook für Echtzeit-Synchronisation der Announcements-Daten über WebSockets
 * Folgt dem Muster von useWorkingGroupsWebSocket
 */
export function useAnnouncementsWebSocket() {
  const [data, setData] = useState<AnnouncementsData>({
    announcements: [],
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
      const [announcementsData, workingGroups] = await Promise.all([
        getAllAnnouncementsAction(),
        getWorkingGroupsArrayAction()
      ]);
      
      // Konvertiere zu IAnnouncement-Format
      const announcements: IAnnouncement[] = announcementsData.map((item: any) => ({
        id: item.id,
        content: item.content,
        date: item.date || '',
        time: item.time || '',
        groupId: item.groupInfo?.id || 'default',
        groupName: item.groupInfo?.name || 'default',
        groupColor: item.groupInfo?.color || '#ff9900',
        important: item.important || false,
        reactions: {},
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      setData({ announcements, workingGroups });
    } catch (error) {
      console.error('[useAnnouncementsWebSocket] Fehler beim Laden der initial Daten:', error);
      toast.error('Fehler beim Laden der Announcements-Daten');
    } finally {
      setLoading(false);
    }
  }, []);

  // Daten vollständig neu laden
  const refreshData = useCallback(async () => {
    try {
      if (DEBUG) {
        console.log('[useAnnouncementsWebSocket] Starte Datenaktualisierung...');
      }
      const [announcementsData, workingGroups] = await Promise.all([
        getAllAnnouncementsAction(),
        getWorkingGroupsArrayAction()
      ]);
      
      // Konvertiere zu IAnnouncement-Format
      const announcements: IAnnouncement[] = announcementsData.map((item: any) => ({
        id: item.id,
        content: item.content,
        date: item.date || '',
        time: item.time || '',
        groupId: item.groupInfo?.id || 'default',
        groupName: item.groupInfo?.name || 'default',
        groupColor: item.groupInfo?.color || '#ff9900',
        important: item.important || false,
        reactions: {},
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      if (DEBUG) {
        console.log('[useAnnouncementsWebSocket] Neue Daten erhalten:', {
          announcementsCount: announcements.length,
          workingGroupsCount: workingGroups.length
        });
      }
      setData({ announcements, workingGroups });
    } catch (error) {
      console.error('[useAnnouncementsWebSocket] Fehler beim Aktualisieren der Daten:', error);
      toast.error('Fehler beim Aktualisieren der Announcements-Daten');
    }
  }, []);

  // WebSocket Message Handler - Nur Updates, keine Toast-Messages
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    if (DEBUG) {
      console.log('[useAnnouncementsWebSocket] WebSocket-Nachricht empfangen:', msg);
    }

    // Prüfe auf announcements-bezogene Topics
    if (msg.topic === 'announcement' || 
        msg.topic === 'announcement-reaction' || 
        msg.topic === 'announcement-reaction-updated' || 
        msg.topic === 'announcements-updated') {
      
      if (DEBUG) {
        console.log('[useAnnouncementsWebSocket] Announcements-Update erkannt, lade Daten neu');
      }
      refreshData();

      // Keine Toast-Messages bei WebSocket-Updates von anderen Admins
      // Toast-Messages werden nur in den Dialog-Callbacks gezeigt
    }
  }, [refreshData]);

  // WebSocket-Verbindung mit globalem WebSocket System
  useGlobalWebSocket({
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      setConnected(true);
      if (DEBUG) {
        console.log('[useAnnouncementsWebSocket] WebSocket verbunden');
      }
    },
    onClose: () => {
      setConnected(false);
      if (DEBUG) {
        console.log('[useAnnouncementsWebSocket] WebSocket getrennt');
      }
    },
    onError: (err) => {
      console.error('[useAnnouncementsWebSocket] WebSocket-Fehler:', err);
      setConnected(false);
    },
    topicFilter: [
      'announcement',
      'announcement-reaction',
      'announcement-reaction-updated',
      'announcements-updated'
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