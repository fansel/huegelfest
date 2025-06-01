"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';
import { getCentralFestivalDaysAction, getAllCentralFestivalDaysAction } from '../actions/festivalDaysActions';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import type { CentralFestivalDay } from '../services/festivalDaysService';

type FestivalDaysWebSocketEventType = 'festival-day';

/**
 * Hook für Echtzeit-Synchronisation der zentralen Festival-Tage über WebSockets
 */
export function useCentralFestivalDays(includeInactive: boolean = false) {
  const [data, setData] = useState<CentralFestivalDay[]>([]);
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
      const result = includeInactive 
        ? await getAllCentralFestivalDaysAction()
        : await getCentralFestivalDaysAction();
      
      if (result.success) {
        setData(result.days);
      } else {
        console.error('[useCentralFestivalDays] Fehler beim Laden:', result.error);
        toast.error('Fehler beim Laden der Festival-Tage');
      }
    } catch (error) {
      console.error('[useCentralFestivalDays] Fehler beim Laden der initial Daten:', error);
      toast.error('Fehler beim Laden der Festival-Tage');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Daten vollständig neu laden
  const refreshData = useCallback(async () => {
    try {
      console.log('[useCentralFestivalDays] Starte Datenaktualisierung...');
      // Loading state während refresh nicht setzen, da das die UI blockiert
      const result = includeInactive 
        ? await getAllCentralFestivalDaysAction()
        : await getCentralFestivalDaysAction();
      
      if (result.success) {
        console.log('[useCentralFestivalDays] Neue Daten erhalten:', {
          daysCount: result.days.length,
          includeInactive
        });
        setData(result.days);
        // Loading explizit auf false setzen nach erfolgreichem refresh
        setLoading(false);
      } else {
        console.error('[useCentralFestivalDays] Fehler beim Laden:', result.error);
        setLoading(false); // Auch bei Fehlern loading beenden
      }
    } catch (error) {
      console.error('[useCentralFestivalDays] Fehler beim Aktualisieren der Daten:', error);
      toast.error('Fehler beim Aktualisieren der Festival-Tage');
      setLoading(false); // Auch bei Exceptions loading beenden
    }
  }, [includeInactive]);

  // WebSocket Message Handler - Nur Updates, keine Toast-Messages
  const handleWebSocketMessage = useCallback((msg: WebSocketMessage) => {
    console.log('[useCentralFestivalDays] WebSocket-Nachricht empfangen:', msg);

    // Prüfe auf festival-day-bezogene Topics
    if (msg.topic === 'festival-day') {
      console.log('[useCentralFestivalDays] Festival-Days-Update erkannt, lade Daten neu');
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
        console.log('[useCentralFestivalDays] WebSocket verbunden');
      },
      onClose: () => {
        updateConnectionStatus();
        console.log('[useCentralFestivalDays] WebSocket getrennt');
      },
      onError: (err: any) => {
        console.error('[useCentralFestivalDays] WebSocket-Fehler:', err);
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