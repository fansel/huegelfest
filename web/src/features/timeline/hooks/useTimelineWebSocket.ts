"use client";

import { useEffect, useState } from 'react';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';

/**
 * Hook: Lauscht auf WebSocket-Events für Timeline-Updates.
 * Gibt einen Zähler zurück, der bei jedem Update inkrementiert wird.
 */
export function useTimelineWebSocket(): number {
  const [updateCount, setUpdateCount] = useState(0);

  useGlobalWebSocket({
    onMessage: (msg: WebSocketMessage) => {
      if (msg.topic === 'timeline') {
        setUpdateCount((count) => count + 1);
      }
    },
    onError: (err) => {
      console.error('[TimelineWebSocket] Fehler:', err);
    },
    topicFilter: ['timeline']
  });

  return updateCount;
} 