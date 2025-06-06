import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { fetchUserActivitiesAction, type UserActivitiesData } from '../actions/fetchUserActivities';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useAuth } from '@/features/auth/AuthContext';

/**
 * Hook für Echtzeit-Synchronisation der Benutzer-Aufgaben über das globale WebSocket-System
 * Modernisiert für session-basierte Authentifizierung
 */
export function useUserActivitiesRealtime() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<UserActivitiesData>({
    activities: [],
    userStatus: { isRegistered: false }
  });
  const [loading, setLoading] = useState(true);
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

  // Initiale Daten laden
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || authLoading) return;
    
    setLoading(true);
    try {
      const initialData = await fetchUserActivitiesAction();
      setData(initialData);
    } catch (error) {
      console.error('[useUserActivitiesRealtime] Fehler beim Laden der Benutzer-Aufgaben:', error);
      if (isOnline) {
        toast.error('Fehler beim Laden der Aufgaben');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, isOnline]);

  // Refresh-Funktion für manuelles Aktualisieren
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    console.log('[useUserActivitiesRealtime] Lade Benutzer-Aufgaben neu...');
    try {
      const freshData = await fetchUserActivitiesAction();
      setData(freshData);
      console.log('[useUserActivitiesRealtime] Benutzer-Aufgaben erfolgreich aktualisiert');
    } catch (error) {
      console.error('[useUserActivitiesRealtime] Fehler beim Neuladen der Benutzer-Aufgaben:', error);
      if (isOnline) {
        toast.error('Fehler beim Aktualisieren der Aufgaben');
      }
    }
  }, [isAuthenticated, isOnline]);

  // WebSocket Message Handler
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('[useUserActivitiesRealtime] WebSocket-Message erhalten:', message);
    
    if (message.topic === 'ACTIVITY_CREATED' || 
        message.topic === 'ACTIVITY_UPDATED' || 
        message.topic === 'ACTIVITY_DELETED' ||
        message.topic === 'group-updated' ||
        message.topic === 'user-assigned' ||
        message.topic === 'user-removed') {
      
      console.log('[useUserActivitiesRealtime] Relevante Activity-Änderung erkannt, lade Daten neu');
      refreshData();
    }
  }, [refreshData]);

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

  // Initiale Daten beim Mount oder Auth-Change laden
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