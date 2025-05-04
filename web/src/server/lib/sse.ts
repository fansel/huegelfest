import { logger } from './logger';

interface Client {
  controller: ReadableStreamDefaultController;
  lastActivity: number;
}

class SSEService {
  private clients: Set<Client> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLIENT_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 Minute
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 Sekunden

  constructor() {
    // Starte Cleanup nur wenn wir nicht in der Edge-Runtime sind
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
      this.startCleanup();
    }
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const client of this.clients) {
        if (now - client.lastActivity > this.CLIENT_TIMEOUT) {
          logger.info('[SSE] Entferne inaktiven Client');
          this.removeClient(client.controller);
        }
      }
    }, this.CLEANUP_INTERVAL);
  }

  addClient(controller: ReadableStreamDefaultController) {
    const client: Client = {
      controller,
      lastActivity: Date.now(),
    };
    
    this.clients.add(client);
    logger.info(`[SSE] Neuer Client verbunden. Aktive Clients: ${this.clients.size}`);
    
    // Sende initiale Verbindungsbestätigung
    try {
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`,
        ),
      );
    } catch (error) {
      logger.error('[SSE] Fehler beim Senden der Verbindungsbestätigung:', error);
      this.removeClient(controller);
    }
  }

  removeClient(controller: ReadableStreamDefaultController) {
    for (const client of this.clients) {
      if (client.controller === controller) {
        this.clients.delete(client);
        logger.info(`[SSE] Client entfernt. Verbleibende Clients: ${this.clients.size}`);
        break;
      }
    }
  }

  sendUpdateToAllClients() {
    const message = `data: ${JSON.stringify({ type: 'update', timestamp: Date.now() })}\n\n`;
    
    for (const client of this.clients) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
        client.lastActivity = Date.now();
      } catch (error) {
        logger.error('[SSE] Fehler beim Senden an Client:', error);
        this.removeClient(client.controller);
      }
    }
  }

  async handleConnection(controller: ReadableStreamDefaultController) {
    this.addClient(controller);
    
    // Sende regelmäßige Heartbeats
    const heartbeatInterval = setInterval(() => {
      try {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`,
          ),
        );
      } catch (error) {
        logger.error('[SSE] Fehler beim Senden des Heartbeats:', error);
        clearInterval(heartbeatInterval);
        this.removeClient(controller);
      }
    }, this.HEARTBEAT_INTERVAL);
    
    // Cleanup bei Verbindungsabbruch
    controller.signal.addEventListener('abort', () => {
      clearInterval(heartbeatInterval);
      this.removeClient(controller);
    });
  }

  createStream() {
    return new ReadableStream({
      start: (controller) => this.handleConnection(controller),
    });
  }

  createResponse() {
    return new Response(this.createStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

// Singleton-Instanz erstellen
export const sseService = new SSEService();
