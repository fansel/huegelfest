'use client';

import { useEffect } from 'react';
import { updateService, UpdateWebSocketMessage } from '@/lib/updateService';
import { useGlobalWebSocket, WebSocketMessage } from '@/shared/hooks/useGlobalWebSocket';

interface UpdateServiceProviderProps {
  children: React.ReactNode;
}

export function UpdateServiceProvider({ children }: UpdateServiceProviderProps) {
  
  // Globaler WebSocket-Hook mit Topic-Filter für Update-Events
  useGlobalWebSocket({
    topicFilter: ['app-update-available', 'force-update', 'update-status-initial'],
    onMessage: (msg: WebSocketMessage) => {
      // Konvertiere zu UpdateWebSocketMessage
      const updateMsg: UpdateWebSocketMessage = {
        topic: msg.topic,
        payload: msg.payload
      };
      updateService.handleWebSocketMessage(updateMsg);
    },
    onOpen: () => {
      console.log('[UpdateServiceProvider] Globale WebSocket-Verbindung hergestellt');
    },
    onClose: () => {
      console.log('[UpdateServiceProvider] Globale WebSocket-Verbindung getrennt');
    },
    onError: (error) => {
      console.warn('[UpdateServiceProvider] Globaler WebSocket-Fehler:', error);
    }
  });

  useEffect(() => {
    // Kurze Verzögerung um App-Boot nicht zu blockieren
    const timer = setTimeout(() => {
      updateService.startAutoUpdateCheck();
    }, 2000);
    
    // Cleanup beim Unmount
    return () => {
      clearTimeout(timer);
      updateService.stopAutoUpdateCheck();
    };
  }, []);

  return <>{children}</>;
} 