'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { globalWebSocketManager } from '@/shared/utils/globalWebSocketManager';
import { useAuth } from '@/features/auth/AuthContext';

const DEBUG = false;

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
   * Unterstützt auch Wildcards, z.B. 'event-*' matched 'event-created', 'event-updated', etc.
   */
  topicFilter?: string[];
  /**
   * Ob eine Authentifizierung erforderlich ist (optional)
   * Standard: false (anonyme Verbindungen erlaubt)
   */
  requireAuth?: boolean;
}

/**
 * Prüft ob ein Topic mit einem Filter-Pattern matched
 * Unterstützt Wildcards (*) am Ende des Patterns
 */
function topicMatches(topic: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return topic.startsWith(prefix);
  }
  return topic === pattern;
}

/**
 * Hook für globale WebSocket-Verbindung
 * - Nutzt den globalen WebSocket Manager
 * - Alle Features teilen sich eine Verbindung
 * - Unterstützt sowohl authentifizierte als auch anonyme Verbindungen
 * - Automatische Cleanup bei Unmount
 */
export function useGlobalWebSocket(options: UseGlobalWebSocketOptions): void {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Ref to hold the latest onMessage handler
  const onMessageRef = useRef(options.onMessage);

  // Keep the ref updated with the latest handler
  useEffect(() => {
    onMessageRef.current = options.onMessage;
  }, [options.onMessage]);
  
  // Wrapper für Message-Handler mit Topic-Filter
  const messageHandler = useCallback((data: any) => {
    const topic = data.topic || 'chat';
    
    // Topic-Filter anwenden wenn gesetzt
    if (options.topicFilter && options.topicFilter.length > 0) {
      const matches = options.topicFilter.some(pattern => topicMatches(topic, pattern));
      if (!matches) {
        if (DEBUG) {
          console.log('[useGlobalWebSocket] Topic ignoriert (kein Match):', {
            topic,
            filter: options.topicFilter
          });
        }
        return; // Message ignorieren
      }
    }
    
    // Message normalisieren
    const message: WebSocketMessage = {
      topic,
      payload: data.payload || data
    };
    
    if (DEBUG) {
      console.log('[useGlobalWebSocket] Message weitergeleitet:', {
        topic: message.topic,
        hasPayload: !!message.payload
      });
    }
    
    // Use the latest handler from the ref
    onMessageRef.current(message);
  }, [options.topicFilter]);

  const openHandler = useCallback(() => {
    if (DEBUG) {
      console.log('[useGlobalWebSocket] Verbindung hergestellt');
    }
    if (options.onOpen) options.onOpen();
  }, [options.onOpen]);

  const closeHandler = useCallback(() => {
    if (DEBUG) {
      console.log('[useGlobalWebSocket] Verbindung getrennt');
    }
    if (options.onClose) options.onClose();
  }, [options.onClose]);

  const errorHandler = useCallback((error: Event) => {
    console.error('[useGlobalWebSocket] Fehler:', error);
    if (options.onError) options.onError(error);
  }, [options.onError]);

  useEffect(() => {
    // Warten bis Auth-Zustand bekannt ist, falls Authentifizierung erforderlich
    if (options.requireAuth && isLoading) {
      if (DEBUG) {
        console.log('[useGlobalWebSocket] Warte auf Auth-Status...');
      }
      return;
    }
    
    // Wenn Authentifizierung erforderlich ist, aber User nicht angemeldet - keine Verbindung
    if (options.requireAuth && !isAuthenticated) {
      if (DEBUG) {
        console.log('[useGlobalWebSocket] Keine Verbindung - Auth erforderlich');
      }
      return;
    }

    if (DEBUG) {
      console.log('[useGlobalWebSocket] Initialisiere Verbindung:', {
        authenticated: isAuthenticated,
        userId: user?.id || 'anonym',
        topicFilter: options.topicFilter
      });
    }

    // Registriere Event-Handler beim globalen Manager
    globalWebSocketManager.addListeners({
      onMessage: messageHandler,
      onOpen: openHandler,
      onClose: closeHandler,
      onError: errorHandler
    });

    // Initialisiere globale WebSocket-Verbindung
    const userId = isAuthenticated && user ? user.id : null;
    globalWebSocketManager.initialize(userId);

    // Cleanup beim Unmount
    return () => {
      if (DEBUG) {
        console.log('[useGlobalWebSocket] Cleanup Handler');
      }
      globalWebSocketManager.removeListeners({
        onMessage: messageHandler,
        onOpen: openHandler,
        onClose: closeHandler,
        onError: errorHandler
      });
    };
  }, [
    messageHandler, 
    openHandler, 
    closeHandler, 
    errorHandler,
    isAuthenticated,
    user?.id,
    isLoading,
    options.requireAuth
  ]);
} 