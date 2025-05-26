'use client';

import { getWebSocketUrl } from './getWebSocketUrl';

// Event-Handler Types
type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketListeners {
  onMessage: Set<MessageHandler>;
  onOpen: Set<ConnectionHandler>;
  onClose: Set<ConnectionHandler>;
  onError: Set<ErrorHandler>;
}

/**
 * Globaler WebSocket-Manager
 * - Eine einzige WebSocket-Verbindung pro App
 * - Mehrere Komponenten können sich registrieren
 * - Intelligente Reconnection mit Device-ID
 */
class GlobalWebSocketManager {
  private static instance: GlobalWebSocketManager;
  private ws: WebSocket | null = null;
  private deviceId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1s
  private listeners: WebSocketListeners = {
    onMessage: new Set(),
    onOpen: new Set(),
    onClose: new Set(),
    onError: new Set()
  };

  static getInstance(): GlobalWebSocketManager {
    if (!GlobalWebSocketManager.instance) {
      GlobalWebSocketManager.instance = new GlobalWebSocketManager();
    }
    return GlobalWebSocketManager.instance;
  }

  /**
   * Initialisiert WebSocket-Verbindung (nur einmal pro App)
   */
  initialize() {
    if (typeof window === 'undefined') return;
    
    // Device-ID aus localStorage oder generieren
    this.deviceId = localStorage.getItem('huegelfest_device_id');
    if (!this.deviceId) {
      this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('huegelfest_device_id', this.deviceId);
    }

    // Nur verbinden wenn noch keine Verbindung existiert
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }
  }

  /**
   * Fügt Event-Listener hinzu
   */
  addListeners(listeners: {
    onMessage?: MessageHandler;
    onOpen?: ConnectionHandler;
    onClose?: ConnectionHandler;
    onError?: ErrorHandler;
  }) {
    if (listeners.onMessage) this.listeners.onMessage.add(listeners.onMessage);
    if (listeners.onOpen) this.listeners.onOpen.add(listeners.onOpen);
    if (listeners.onClose) this.listeners.onClose.add(listeners.onClose);
    if (listeners.onError) this.listeners.onError.add(listeners.onError);
  }

  /**
   * Entfernt Event-Listener
   */
  removeListeners(listeners: {
    onMessage?: MessageHandler;
    onOpen?: ConnectionHandler;
    onClose?: ConnectionHandler;
    onError?: ErrorHandler;
  }) {
    if (listeners.onMessage) this.listeners.onMessage.delete(listeners.onMessage);
    if (listeners.onOpen) this.listeners.onOpen.delete(listeners.onOpen);
    if (listeners.onClose) this.listeners.onClose.delete(listeners.onClose);
    if (listeners.onError) this.listeners.onError.delete(listeners.onError);
  }

  /**
   * Sendet Nachricht über WebSocket
   */
  send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      return true;
    }
    return false;
  }

  /**
   * Verbindungsaufbau
   */
  private connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const wsUrl = getWebSocketUrl();
      console.log(`[GlobalWebSocket] Verbinde mit Device-ID: ${this.deviceId}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[GlobalWebSocket] Verbunden als ${this.deviceId}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Automatische Device-Registrierung beim Server
        if (this.deviceId) {
          this.ws?.send(JSON.stringify({
            type: 'DEVICE_REGISTRATION',
            deviceId: this.deviceId
          }));
        }
        
        // Alle onOpen-Handler aufrufen
        this.listeners.onOpen.forEach(handler => {
          try {
            handler();
          } catch (error) {
            console.warn('[GlobalWebSocket] Fehler in onOpen-Handler:', error);
          }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Alle onMessage-Handler aufrufen
          this.listeners.onMessage.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.warn('[GlobalWebSocket] Fehler in onMessage-Handler:', error);
            }
          });
        } catch (error) {
          console.warn('[GlobalWebSocket] Ungültige JSON-Nachricht:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[GlobalWebSocket] Verbindung getrennt:`, event.code, event.reason);
        this.isConnecting = false;
        
        // Alle onClose-Handler aufrufen
        this.listeners.onClose.forEach(handler => {
          try {
            handler();
          } catch (error) {
            console.warn('[GlobalWebSocket] Fehler in onClose-Handler:', error);
          }
        });

        // Intelligente Reconnection
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[GlobalWebSocket] WebSocket-Fehler:', error);
        this.isConnecting = false;
        
        // Alle onError-Handler aufrufen
        this.listeners.onError.forEach(handler => {
          try {
            handler(error);
          } catch (err) {
            console.warn('[GlobalWebSocket] Fehler in onError-Handler:', err);
          }
        });
      };

    } catch (error) {
      console.error('[GlobalWebSocket] Verbindungsaufbau fehlgeschlagen:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Intelligente Reconnection mit exponential backoff
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[GlobalWebSocket] Max Reconnect-Versuche erreicht');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30s
    );

    this.reconnectAttempts++;
    console.log(`[GlobalWebSocket] Reconnect in ${delay}ms (Versuch ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        this.connect();
      }
    }, delay);
  }

  /**
   * Schließt Verbindung
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Status-Informationen
   */
  getStatus() {
    return {
      deviceId: this.deviceId,
      connected: this.ws?.readyState === WebSocket.OPEN,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      listenerCount: {
        message: this.listeners.onMessage.size,
        open: this.listeners.onOpen.size,
        close: this.listeners.onClose.size,
        error: this.listeners.onError.size
      }
    };
  }
}

// Singleton Export
export const globalWebSocketManager = GlobalWebSocketManager.getInstance(); 