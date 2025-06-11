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
 * - Unterstützt sowohl authentifizierte als auch anonyme Verbindungen
 */
class GlobalWebSocketManager {
  private static instance: GlobalWebSocketManager;
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1s
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
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
   * Erzwingt eine neue Verbindung
   * Nützlich bei User-Wechsel
   */
  reconnect() {
    if (this.ws) {
      this.disconnect();
    }
    this.connect();
  }

  /**
   * Initialisiert WebSocket-Verbindung
   * @param userId - ID des authentifizierten Benutzers (null für anonyme Verbindungen)
   */
  initialize(userId: string | null) {
    if (typeof window === 'undefined') return;
    
    // Update userId wenn sich der authentifizierte User ändert
    if (this.userId !== userId) {
      this.userId = userId;
      
      // Schließe bestehende Verbindung und baue neue auf
      if (this.ws) {
        this.reconnect();
      }
    }

    // Verbinden wenn noch keine Verbindung existiert
    if (!this.ws && !this.isConnecting) {
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
  public send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.warn('[GlobalWebSocket] Versuch zu senden während Socket nicht verbunden');
    }
  }

  /**
   * Sendet JSON-Nachricht über WebSocket
   */
  public sendJSON(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('[GlobalWebSocket] Fehler beim Senden der JSON-Nachricht:', error);
      }
    } else {
      console.warn('[GlobalWebSocket] Versuch JSON zu senden während Socket nicht verbunden');
    }
  }

  /**
   * Verbindungsaufbau
   */
  private connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const wsUrl = getWebSocketUrl();
      const connectionType = this.userId ? `User: ${this.userId}` : 'Anonymous';
      console.log(`[GlobalWebSocket] Verbinde als ${connectionType}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[GlobalWebSocket] Verbunden als ${connectionType}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // User-Registrierung beim Server (falls authentifiziert)
        if (this.userId) {
          this.ws?.send(JSON.stringify({
            type: 'USER_REGISTRATION',
            userId: this.userId
          }));
        } else {
          // Anonyme Verbindung - keine Registrierung nötig
          console.log('[GlobalWebSocket] Anonyme Verbindung hergestellt');
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
        this.ws = null;
        
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

    this.reconnectTimeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        this.connect();
      }
    }, delay);
  }

  /**
   * Schließt die Verbindung und unterbindet Reconnects
   */
  disconnect() {
    // Laufende Reconnect-Versuche stoppen
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.reconnectAttempts = 0; // Reset für manuelle Wiederverbindung

    if (this.ws) {
      console.log('[GlobalWebSocket] Schließe Verbindung explizit');
      // Event-Listener entfernen um getrennt-Logik zu umgehen
      this.ws.onclose = null; 
      this.ws.onerror = null;
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Status-Informationen
   */
  getStatus() {
    return {
      userId: this.userId,
      isAuthenticated: !!this.userId,
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