import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { fetchGroupsData, type GroupsData } from '../actions/fetchGroupsData';

interface UseGroupsPollingOptions {
  pollInterval?: number; // in milliseconds, default 10 seconds
  enablePolling?: boolean; // default true
}

/**
 * Hook für Daten-Synchronisation über Polling (einfachere Alternative zu WebSockets)
 */
export function useGroupsPolling(options: UseGroupsPollingOptions = {}) {
  const { pollInterval = 10000, enablePolling = true } = options;
  
  const [data, setData] = useState<GroupsData>({
    groups: [],
    statistics: null,
    users: [],
    registrations: []
  });
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(enablePolling);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Daten laden
  const loadData = useCallback(async (showToast = false) => {
    try {
      const freshData = await fetchGroupsData();
      
      // Prüfen ob sich Daten geändert haben
      const hasChanges = JSON.stringify(data) !== JSON.stringify(freshData);
      
      setData(freshData);
      lastFetchRef.current = Date.now();
      
      if (hasChanges && showToast && !loading) {
        toast.success('Daten wurden aktualisiert', { duration: 2000 });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      if (showToast) {
        toast.error('Fehler beim Aktualisieren der Daten');
      }
    }
  }, [data, loading]);

  // Initiale Daten laden
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      await loadData(false);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // Polling starten/stoppen
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, pollInterval);
    setPolling(true);
  }, [loadData, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

  // Manuelles Refresh
  const refreshData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Page Visibility API - pausiere Polling wenn Tab nicht aktiv
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enablePolling) {
        // Wenn Tab wieder aktiv wird, einmal sofort laden dann Polling starten
        loadData(true);
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enablePolling, loadData, startPolling, stopPolling]);

  // Setup
  useEffect(() => {
    loadInitialData();
    
    if (enablePolling) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enablePolling, loadInitialData, startPolling, stopPolling]);

  return {
    data,
    loading,
    polling,
    lastFetch: lastFetchRef.current,
    refreshData,
    startPolling,
    stopPolling
  };
} 