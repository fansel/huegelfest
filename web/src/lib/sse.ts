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
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
      this.startCleanup();
    }
  }

  private isControllerActive(client: Client): boolean {
    try {
      if (client.isClosed) {
        return false;
      }
      // Prüfe, ob der Controller noch aktiv ist
      const controller = client.controller;
      if (!controller || controller.desiredSize === null) {
        return false;
      }
      return true;
    } catch (error) {
      logger.debug('[SSE] Controller nicht mehr aktiv:', error);
      return false;
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      const clientsToRemove: Client[] = [];
      
      this.clients.forEach(client => {
        try {
          if (this.isControllerActive(client)) {
            try {
              const message = new TextEncoder().encode(
                `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
              );
              client.controller.enqueue(message);
              client.lastActivity = Date.now();
            } catch (error) {
              logger.debug('[SSE] Fehler beim Senden des Heartbeats, markiere Client zum Entfernen:', error);
              clientsToRemove.push(client);
            }
          } else {
            clientsToRemove.push(client);
          }
        } catch (error) {
          logger.error('[SSE] Fehler beim Verarbeiten des Heartbeats:', error);
          clientsToRemove.push(client);
        }
      });

      // Entferne inaktive Clients außerhalb der forEach-Schleife
      clientsToRemove.forEach(client => {
        this.removeClient(client.controller);
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
        try {
          controller.close();
        } catch (error) {
          logger.debug('[SSE] Controller bereits geschlossen');
        }
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
