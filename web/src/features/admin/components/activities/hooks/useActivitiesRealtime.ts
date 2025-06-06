import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { fetchActivitiesData, type ActivitiesData } from '../actions/fetchActivitiesData';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

type ActivitiesEvent = {
  type: 'ACTIVITY_CREATED' | 'ACTIVITY_UPDATED' | 'ACTIVITY_DELETED' | 'ACTIVITY_CATEGORY_CREATED' | 'ACTIVITY_CATEGORY_UPDATED' | 'ACTIVITY_CATEGORY_DELETED';
  data: any;
  timestamp: string;
};

// Am Anfang der Datei
const DEBUG = true; // Set to true to help debug the current issue

const EMPTY_DATA: ActivitiesData = {
  activities: [],
  categories: [],
  templates: [],
  groups: []
};

/**
 * Überprüft ob die Daten gültig sind
 */
function isValidData(data: ActivitiesData | undefined | null): data is ActivitiesData {
  if (!data) return false;
  
  const hasArrays = Array.isArray(data.activities) && 
                   Array.isArray(data.categories) && 
                   Array.isArray(data.templates) && 
                   Array.isArray(data.groups);
                   
  if (DEBUG) {
    console.log('[useActivitiesRealtime] Data validation:', {
      hasArrays,
      activitiesCount: data.activities?.length || 0,
      categoriesCount: data.categories?.length || 0,
      templatesCount: data.templates?.length || 0,
      groupsCount: data.groups?.length || 0,
      isValid: hasArrays
    });
  }
  
  return hasArrays;
}

/**
 * Hook für Echtzeit-Synchronisation der Activities-Daten über das globale WebSocket-System
 * Folgt dem exakten Pattern von useGroupsWebSocket
 */
export function useActivitiesRealtime(initialData?: ActivitiesData) {
  const [data, setData] = useState<ActivitiesData>(() => {
    if (DEBUG) {
      console.log('[useActivitiesRealtime] Hook called with initial data:', {
        hasInitialData: !!initialData,
        activitiesCount: initialData?.activities?.length || 0,
        categoriesCount: initialData?.categories?.length || 0,
        templatesCount: initialData?.templates?.length || 0,
        groupsCount: initialData?.groups?.length || 0,
        activities: initialData?.activities,
        categories: initialData?.categories,
        templates: initialData?.templates,
        groups: initialData?.groups,
        isValid: isValidData(initialData)
      });
    }

    // Validiere initial data
    if (isValidData(initialData)) {
      if (DEBUG) {
        console.log('[useActivitiesRealtime] Using valid initial data');
      }
      return initialData;
    }

    if (DEBUG) {
      console.log('[useActivitiesRealtime] No valid initial data, starting with empty arrays');
    }
    return EMPTY_DATA;
  });

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const isOnline = useNetworkStatus();
  
  // Use a ref to track if we have valid data
  const hasValidDataRef = useRef(isValidData(data));
  const loadAttempts = useRef(0);

  // Initiale Daten laden
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const freshData = await fetchActivitiesData();
        if (DEBUG) {
          console.log('[useActivitiesRealtime] Loaded fresh data:', {
            activitiesCount: freshData.activities?.length || 0,
            categoriesCount: freshData.categories?.length || 0,
            templatesCount: freshData.templates?.length || 0,
            groupsCount: freshData.groups?.length || 0,
            activities: freshData.activities,
            categories: freshData.categories,
            templates: freshData.templates,
            groups: freshData.groups
          });
        }
        setData(freshData);
      } catch (error) {
        console.error('[useActivitiesRealtime] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // WebSocket-Verbindung
  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      if (DEBUG) {
        console.log('[useActivitiesRealtime] WebSocket message:', msg);
      }

      if (
        msg.topic === 'ACTIVITY_CREATED' ||
        msg.topic === 'ACTIVITY_UPDATED' ||
        msg.topic === 'ACTIVITY_DELETED'
      ) {
        refreshData();
      }
    },
    onOpen: () => {
      setConnected(true);
    },
    onClose: () => {
      setConnected(false);
    },
    topicFilter: ['ACTIVITY_CREATED', 'ACTIVITY_UPDATED', 'ACTIVITY_DELETED']
  });

  // Refresh function
  const refreshData = useCallback(async () => {
    try {
      const freshData = await fetchActivitiesData();
      if (DEBUG) {
        console.log('[useActivitiesRealtime] Refreshed data:', {
          activitiesCount: freshData.activities?.length || 0,
          categoriesCount: freshData.categories?.length || 0,
          templatesCount: freshData.templates?.length || 0,
          groupsCount: freshData.groups?.length || 0,
          activities: freshData.activities,
          categories: freshData.categories,
          templates: freshData.templates,
          groups: freshData.groups
        });
      }
      setData(freshData);
    } catch (error) {
      console.error('[useActivitiesRealtime] Error refreshing data:', error);
    }
  }, []);

  return {
    data,
    loading,
    connected,
    refreshData
  };
} 