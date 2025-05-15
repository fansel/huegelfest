"use client";

import { useEffect, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '@/shared/hooks/useWebSocket';
import { getWebSocketUrl } from '@/shared/utils/getWebSocketUrl';

/**
 * Hook: Lauscht auf WebSocket-Events für Timeline-Updates.
 * Gibt einen Zähler zurück, der bei jedem Update inkrementiert wird.
 */
export function useTimelineWebSocket(): number {
  const [updateCount, setUpdateCount] = useState(0);

  useWebSocket(
    getWebSocketUrl(),
    {
      onMessage: (msg: WebSocketMessage) => {
        if (msg.topic === 'timeline') {
          setUpdateCount((count) => count + 1);
        }
      },
      onError: (err) => {
        console.error('[TimelineWebSocket] Fehler:', err);
      },
      reconnectIntervalMs: 5000,
    }
  );

  return updateCount;
} 