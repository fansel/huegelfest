import { logger } from './logger';

interface Client {
  controller: ReadableStreamDefaultController;
  lastActivity: number;
  isClosed: boolean;
}

export class SSEService {
  private clients: Set<Client> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly CLIENT_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 Minute
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 Sekunden

  constructor() {
    this.startHeartbeat();
    // Starte Cleanup nur wenn wir nicht in der Edge-Runtime sind
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
      this.startCleanup();
    }
  }

  private isControllerActive(client: Client): boolean {
    return !client.isClosed && client.controller.desiredSize !== null;
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(client => {
        try {
          if (this.isControllerActive(client)) {
            client.controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
              )
            );
            client.lastActivity = Date.now();
          } else {
            logger.debug('[SSE] Entferne inaktiven Client beim Heartbeat');
            this.removeClient(client.controller);
          }
        } catch (error) {
          logger.error('[SSE] Fehler beim Senden des Heartbeats:', error);
          this.removeClient(client.controller);
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  private startCleanup() {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      Array.from(this.clients).forEach(client => {
        if (now - client.lastActivity > this.CLIENT_TIMEOUT) {
          logger.info('[SSE] Entferne inaktiven Client');
          this.removeClient(client.controller);
        }
      });
    }, this.CLEANUP_INTERVAL);
  }

  addClient(controller: ReadableStreamDefaultController) {
    const client: Client = {
      controller,
      lastActivity: Date.now(),
      isClosed: false
    };
    this.clients.add(client);
    logger.info(`[SSE] Neuer Client verbunden. Aktive Clients: ${this.clients.size}`);
  }

  removeClient(controller: ReadableStreamDefaultController) {
    try {
      const clientToRemove = Array.from(this.clients).find(client => client.controller === controller);
      if (clientToRemove) {
        clientToRemove.isClosed = true;
        this.clients.delete(clientToRemove);
        logger.info(`[SSE] Client entfernt. Verbleibende Clients: ${this.clients.size}`);
      }
    } catch (error) {
      logger.error('[SSE] Fehler beim Entfernen des Clients:', error);
    }
  }

  sendUpdateToAllClients() {
    logger.info(`[SSE] Sende Update an ${this.clients.size} Clients`);
    this.clients.forEach(client => {
      try {
        if (this.isControllerActive(client)) {
          const updateData = { type: 'update', timestamp: Date.now() };
          logger.debug('[SSE] Sende Update:', updateData);
          client.controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify(updateData)}\n\n`
            )
          );
          client.lastActivity = Date.now();
        } else {
          logger.debug('[SSE] Entferne inaktiven Client beim Update-Versuch');
          this.removeClient(client.controller);
        }
      } catch (error) {
        logger.error('[SSE] Fehler beim Senden des Updates:', error);
        this.removeClient(client.controller);
      }
    });
  }

  createResponse(): Response {
    const stream = new ReadableStream({
      start: (controller) => {
        this.addClient(controller);
        
        // Sende initiales Update
        try {
          const initData = { type: 'connected', timestamp: Date.now() };
          logger.debug('[SSE] Sende initiales Update:', initData);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify(initData)}\n\n`
            )
          );
        } catch (error) {
          logger.error('[SSE] Fehler beim Senden des initialen Updates:', error);
          this.removeClient(controller);
        }
      },
      cancel: (controller) => {
        this.removeClient(controller);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }
}

// Singleton-Instanz erstellen
export const sseService = new SSEService();

// Exportiere die benötigten Funktionen
export function addClient(controller: ReadableStreamDefaultController) {
  sseService.addClient(controller);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  sseService.removeClient(controller);
}

export function sendUpdateToAllClients() {
  sseService.sendUpdateToAllClients();
}
