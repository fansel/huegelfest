// useWebSocket.ts
// DEPRECATED: Legacy-Wrapper für globalen WebSocket Manager
// Verwende stattdessen useGlobalWebSocket für bessere Performance

'use client';

import { useGlobalWebSocket, WebSocketMessage } from './useGlobalWebSocket';

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

// Re-export WebSocketMessage für Kompatibilität
export type { WebSocketMessage };

/**
 * DEPRECATED: Legacy useWebSocket Hook
 * 
 * Dieser Hook nutzt jetzt den globalen WebSocket Manager.
 * Alle Komponenten teilen sich eine einzige WebSocket-Verbindung.
 * 
 * @deprecated Verwende useGlobalWebSocket mit topicFilter für bessere Performance
 * @param url WebSocket-URL (wird ignoriert - globaler Manager übernimmt)
 * @param options Callback-Optionen
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions
): void {
  console.warn(`[useWebSocket] DEPRECATED: ${url} - Verwende useGlobalWebSocket für bessere Performance`);
  
  // Nutze globalen Manager statt eigene Verbindung
  useGlobalWebSocket({
    onMessage: options.onMessage,
    onOpen: options.onOpen,
    onClose: options.onClose,
    onError: options.onError
    // URL, reconnectIntervalMs und onUnavailable werden ignoriert - globaler Manager übernimmt
  });
} 