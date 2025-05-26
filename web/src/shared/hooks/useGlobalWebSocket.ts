'use client';

import { useEffect, useCallback } from 'react';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';

// Type-Export für Kompatibilität
export interface WebSocketMessage<T = unknown> {
  topic: string;
  payload: T;
}

export interface UseGlobalWebSocketOptions {
  onMessage: (msg: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  /**
   * Filter für spezifische Topics (optional)
   * Wenn gesetzt, werden nur Messages mit diesen Topics weitergeleitet
   */
  topicFilter?: string[];
}

/**
 * Hook für globale WebSocket-Verbindung
 * - Nutzt den globalen WebSocket Manager
 * - Alle Features teilen sich eine Verbindung
 * - Automatische Cleanup bei Unmount
 */
export function useGlobalWebSocket(options: UseGlobalWebSocketOptions): void {
  // Wrapper für Message-Handler mit Topic-Filter
  const messageHandler = useCallback((data: any) => {
    // Topic-Filter anwenden wenn gesetzt
    if (options.topicFilter && options.topicFilter.length > 0) {
      if (!options.topicFilter.includes(data.topic)) {
        return; // Message ignorieren
      }
    }
    
    // Legacy-Support: Behandle auch Non-Topic Messages
    const message: WebSocketMessage = {
      topic: data.topic || 'chat',
      payload: data.payload || data
    };
    
    options.onMessage(message);
  }, [options.onMessage, options.topicFilter]);

  const openHandler = useCallback(() => {
    if (options.onOpen) options.onOpen();
  }, [options.onOpen]);

  const closeHandler = useCallback(() => {
    if (options.onClose) options.onClose();
  }, [options.onClose]);

  const errorHandler = useCallback((error: Event) => {
    if (options.onError) options.onError(error);
  }, [options.onError]);

  useEffect(() => {
    // Registriere Event-Handler beim globalen Manager
    globalWebSocketManager.addListeners({
      onMessage: messageHandler,
      onOpen: openHandler,
      onClose: closeHandler,
      onError: errorHandler
    });

    // Initialisiere globale WebSocket-Verbindung (falls noch nicht geschehen)
    globalWebSocketManager.initialize();

    // Cleanup beim Unmount
    return () => {
      globalWebSocketManager.removeListeners({
        onMessage: messageHandler,
        onOpen: openHandler,
        onClose: closeHandler,
        onError: errorHandler
      });
    };
  }, [messageHandler, openHandler, closeHandler, errorHandler]);
}

/**
 * Legacy-Wrapper für bestehende useWebSocket-Verwendungen
 * Ermöglicht einfache Migration ohne Code-Änderungen
 * 
 * @deprecated Verwende useGlobalWebSocket mit topicFilter
 */
export function useWebSocket(url: string, options: {
  onMessage: (msg: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  reconnectIntervalMs?: number;
}) {
  console.warn('[useWebSocket] DEPRECATED: Verwende useGlobalWebSocket für bessere Performance');
  
  // Nutze globalen Manager statt eigene Verbindung
  useGlobalWebSocket({
    onMessage: options.onMessage,
    onOpen: options.onOpen,
    onClose: options.onClose,
    onError: options.onError
    // URL und reconnectIntervalMs werden ignoriert - globaler Manager übernimmt
  });
} 