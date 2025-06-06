"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';
import { getCentralFestivalDaysAction, getAllCentralFestivalDaysAction } from '../actions/festivalDaysActions';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import type { CentralFestivalDay } from '../services/festivalDaysService';

type FestivalDaysWebSocketEventType = 'festival-day';

const DEBUG = false;

/**
 * Hook für Echtzeit-Synchronisation der zentralen Festival-Tage über WebSockets
 */
export function useCentralFestivalDays(includeInactive: boolean = false) {
  const [data, setData] = useState<CentralFestivalDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

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
    if (DEBUG) {
      console.log('[useCentralFestivalDays] Starte Datenaktualisierung...');
    }
    
    try {
      const response = await fetch('/api/festival-days');
      const newData = await response.json();
      
      if (DEBUG) {
        console.log('[useCentralFestivalDays] Neue Daten erhalten:', {
          daysCount: newData?.length || 0,
          days: newData?.map((d: any) => ({
            id: d._id,
            label: d.label,
            date: d.date,
            isActive: d.isActive
          }))
        });
      }
      
      setData(newData);
    } catch (error) {
      console.error('[useCentralFestivalDays] Fehler beim Aktualisieren:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket-Verbindung mit globalem WebSocket System
  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      if (DEBUG) {
        console.log('[useCentralFestivalDays] WebSocket-Nachricht empfangen:', msg);
      }

      if (msg.topic === 'festival-days-update') {
        if (DEBUG) {
          console.log('[useCentralFestivalDays] Festival-Days-Update erkannt, lade Daten neu');
        }
        refreshData();
      }
    },
    onOpen: () => {
      setConnected(true);
      if (DEBUG) {
        console.log('[useCentralFestivalDays] WebSocket verbunden');
      }
    },
    onClose: () => {
      setConnected(false);
      if (DEBUG) {
        console.log('[useCentralFestivalDays] WebSocket getrennt');
      }
    },
    onError: (err) => {
      console.error('[useCentralFestivalDays] WebSocket-Fehler:', err);
      setConnected(false);
    },
    topicFilter: ['festival-days-update']
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