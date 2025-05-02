import { logger } from './logger';

interface Client {
  controller: ReadableStreamDefaultController;
  lastActivity: number;
}

const clients = new Set<Client>();
const CLIENT_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
const CLEANUP_INTERVAL = 60 * 1000; // 1 Minute

// Cleanup-Intervall für inaktive Clients
setInterval(() => {
  const now = Date.now();
  for (const client of clients) {
    if (now - client.lastActivity > CLIENT_TIMEOUT) {
      logger.info('[SSE] Entferne inaktiven Client');
      removeClient(client.controller);
    }
  }
}, CLEANUP_INTERVAL);

// Funktion zum Senden von Updates an alle verbundenen Clients
export function sendUpdateToAllClients() {
  const message = `data: ${JSON.stringify({ type: 'update', timestamp: Date.now() })}\n\n`;
  
  for (const client of clients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
      client.lastActivity = Date.now();
    } catch (error) {
      logger.error('[SSE] Fehler beim Senden an Client:', error);
      removeClient(client.controller);
    }
  }
}

// Funktion zum Hinzufügen eines neuen Clients
export function addClient(controller: ReadableStreamDefaultController) {
  const client: Client = {
    controller,
    lastActivity: Date.now(),
  };
  
  clients.add(client);
  logger.info(`[SSE] Neuer Client verbunden. Aktive Clients: ${clients.size}`);
  
  // Sende initiale Verbindungsbestätigung
  try {
    controller.enqueue(
      new TextEncoder().encode(
        `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`,
      ),
    );
  } catch (error) {
    logger.error('[SSE] Fehler beim Senden der Verbindungsbestätigung:', error);
    removeClient(controller);
  }
}

// Funktion zum Entfernen eines Clients
export function removeClient(controller: ReadableStreamDefaultController) {
  for (const client of clients) {
    if (client.controller === controller) {
      clients.delete(client);
      logger.info(`[SSE] Client entfernt. Verbleibende Clients: ${clients.size}`);
      break;
    }
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      addClient(controller);
      
      // Sende regelmäßige Heartbeats
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`,
            ),
          );
        } catch (error) {
          logger.error('[SSE] Fehler beim Senden des Heartbeats:', error);
          clearInterval(heartbeatInterval);
          removeClient(controller);
        }
      }, 30000); // Alle 30 Sekunden
      
      // Cleanup bei Verbindungsabbruch
      controller.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeClient(controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
