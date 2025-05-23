// useWebSocket.ts
// Typsicherer React-Hook für WebSocket-Verbindungen
// Unterstützt verschiedene Topics, Reconnect, Fehlerbehandlung

'use client';

import { useEffect, useRef } from 'react';

export interface WebSocketMessage<T = unknown> {
  topic: string;
  payload: T;
}

export interface UseWebSocketOptions {
  onMessage: (msg: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  reconnectIntervalMs?: number;
  /**
   * Wird aufgerufen, wenn WebSocket dauerhaft nicht verfügbar ist (z.B. Verbindungsaufbau-Fehler)
   */
  onUnavailable?: (err: unknown) => void;
}

/**
 * useWebSocket
 * @param url WebSocket-URL (z.B. ws://localhost:8080)
 * @param options Callback-Optionen
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions
): void {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    let wsFailed = false;

    function connect() {
      try {
        ws.current = new window.WebSocket(url);
      } catch (err) {
        wsFailed = true;
        if (options.onUnavailable) options.onUnavailable(err);
        // Kein Fehler ins UI loggen, nur still bleiben
        // Reconnect nach Intervall versuchen
        if (isMounted) {
          reconnectTimeout.current = setTimeout(
            connect,
            options.reconnectIntervalMs ?? 5000
          );
        }
        return;
      }

      ws.current.onopen = () => {
        wsFailed = false;
        if (options.onOpen) options.onOpen();
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          options.onMessage(data);
        } catch (err) {
          if (options.onError) options.onError(event);
        }
      };

      ws.current.onerror = (event: Event) => {
        if (options.onError) options.onError(event);
      };

      ws.current.onclose = () => {
        if (options.onClose) options.onClose();
        // Reconnect-Logik
        if (isMounted) {
          reconnectTimeout.current = setTimeout(
            connect,
            options.reconnectIntervalMs ?? 5000
          );
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
} 