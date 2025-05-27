import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { fetchGroupsData, type GroupsData } from '../actions/fetchGroupsData';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

type GroupsEvent = {
  type: 'GROUP_CREATED' | 'GROUP_UPDATED' | 'GROUP_DELETED' | 'USER_ASSIGNED' | 'USER_REMOVED' | 'REGISTRATION_UPDATED';
  data: any;
  timestamp: string;
  adminId?: string;
};

/**
 * Hook für Echtzeit-Synchronisation der Groups-Daten über WebSockets
 */
export function useGroupsRealtime() {
  const [data, setData] = useState<GroupsData>({
    groups: [],
    statistics: null,
    users: [],
    registrations: []
  });
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const isOnline = useNetworkStatus();

  // Initiale Daten laden
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const initialData = await fetchGroupsData();
      setData(initialData);
    } catch (error) {
      console.error('Fehler beim Laden der initial Daten:', error);
      if (isOnline) {
        toast.error('Fehler beim Laden der Daten');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  // Daten vollständig neu laden (fallback)
  const refreshData = useCallback(async () => {
    try {
      const freshData = await fetchGroupsData();
      setData(freshData);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
      if (isOnline) {
        toast.error('Fehler beim Aktualisieren der Daten');
      }
    }
  }, [isOnline]);

  // WebSocket Event Handler
  const handleWebSocketMessage = useCallback((event: GroupsEvent) => {
    switch (event.type) {
      case 'GROUP_CREATED':
        setData(prev => ({
          ...prev,
          groups: [...prev.groups, event.data]
        }));
        toast.success(`Neue Gruppe "${event.data.name}" wurde erstellt`);
        break;

      case 'GROUP_UPDATED':
        setData(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.id === event.data.id ? event.data : group
          )
        }));
        toast.success(`Gruppe "${event.data.name}" wurde aktualisiert`);
        break;

      case 'GROUP_DELETED':
        setData(prev => ({
          ...prev,
          groups: prev.groups.filter(group => group.id !== event.data.groupId)
        }));
        toast.success('Gruppe wurde gelöscht');
        break;

      case 'USER_ASSIGNED':
      case 'USER_REMOVED':
      case 'REGISTRATION_UPDATED':
        // Für komplexere Updates: komplette Daten neu laden
        refreshData();
        break;

      default:
        console.warn('Unbekannter WebSocket Event Type:', event.type);
    }
  }, [refreshData]);

  useEffect(() => {
    loadInitialData();

    // WebSocket-Verbindung aufbauen
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/admin/groups`);
    
    ws.onopen = () => {
      setConnected(true);
      console.log('Groups WebSocket verbunden');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GroupsEvent;
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Fehler beim Parsen der WebSocket-Nachricht:', error);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Groups WebSocket getrennt');
      // Automatisch reconnect nach 3 Sekunden
      setTimeout(() => {
        if (ws.readyState === WebSocket.CLOSED) {
          // Hier würde man den WebSocket neu aufbauen
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Fehler:', error);
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [loadInitialData, handleWebSocketMessage]);

  return {
    data,
    loading,
    connected,
    refreshData
  };
} 