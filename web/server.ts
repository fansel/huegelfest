// server.ts
import { initializeAgenda, cleanupStaleJobs } from './src/lib/pushScheduler/agenda.js';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { setWebSocketServer, broadcast } from './src/lib/websocket/broadcast.js';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Export connection maps for diagnostics
export const userConnections = new Map<string, WebSocket>(); // User-basierte Verbindungen
export const anonymousConnections = new Set<WebSocket>(); // Anonyme Verbindungen
export const activeConnections = new Map<WebSocket, { id: string | null; type: 'user' | 'anonymous' }>();

// Function to get current WebSocket statistics
export function getWebSocketStats() {
  const connectionsByUser = new Map<string, number>();
  const activeUsers: Array<{userId: string, connected: boolean, readyState: number}> = [];
  
  // User connections
  for (const [userId, ws] of userConnections) {
    const count = connectionsByUser.get(userId) || 0;
    connectionsByUser.set(userId, count + 1);
    
    activeUsers.push({
      userId,
      connected: ws.readyState === WebSocket.OPEN,
      readyState: ws.readyState
    });
  }
  
  return {
    totalConnections: activeConnections.size,
    totalUsers: userConnections.size,
    totalAnonymous: anonymousConnections.size,
    usersList: activeUsers,
    connectionsByUser: Object.fromEntries(connectionsByUser)
  };
}

app
  .prepare()
  .then(async () => {

    // ─── 0. Agenda Scheduler initialisieren ───────────────────────────────────────
    try {
      await initializeAgenda();
      console.log('> [Agenda] Scheduler initialized successfully.');
      await cleanupStaleJobs();
    } catch (error) {
      console.error('> [Agenda] Failed to initialize scheduler:', error);
      process.exit(1); // Exit if scheduler fails to start
    }

    // ─── 1. HTTP-Server aufsetzen ────────────────────────────────────────────────
    const server = createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/internal/broadcast') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
          try {
            const { topic, payload } = JSON.parse(body);
            broadcast(topic, payload);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', error: (e as Error).message }));
          }
        });
        return;
      }

      // Add diagnostics endpoint for WebSocket stats
      if (req.method === 'GET' && req.url === '/internal/websocket-stats') {
        try {
          const stats = getWebSocketStats();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(stats));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', error: (e as Error).message }));
        }
        return;
      }

      const parsedUrl = parse(req.url || '', true);
      handle(req, res, parsedUrl);
    });

    // ─── 3. WebSocket-Server ─────────────────────────────────────────────────────
    const wss = new WebSocketServer({ noServer: true });
    setWebSocketServer(wss);

    // Moderner Client-Management mit User-ID und anonymen Verbindungen
    console.log('[WebSocket] Initialisiere WebSocket-Server auf /ws …');
    wss.on('connection', ws => {
      let connectionId: string | null = null;
      let connectionType: 'user' | 'anonymous' = 'anonymous';
      
      console.log('[WebSocket] Neue Verbindung eingegangen');

      // Erstmal als anonyme Verbindung registrieren
      anonymousConnections.add(ws);
      activeConnections.set(ws, { id: null, type: 'anonymous' });

      ws.on('message', message => {
        try {
          const data = JSON.parse(message.toString());
          
          // Prüfe auf User-ID Registration
          if (data.type === 'USER_REGISTRATION' && data.userId && typeof data.userId === 'string') {
            const registeredUserId = data.userId;
            
            // Von anonymer zu authentifizierter Verbindung wechseln
            anonymousConnections.delete(ws);
            
            // Prüfe ob User bereits verbunden ist
            const existingConnection = userConnections.get(registeredUserId);
            if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
              console.log(`[WebSocket] User ${registeredUserId} bereits verbunden - schließe alte Verbindung`);
              existingConnection.close();
            }
            
            // Registriere neue User-Verbindung
            connectionId = registeredUserId;
            connectionType = 'user';
            userConnections.set(registeredUserId, ws);
            activeConnections.set(ws, { id: registeredUserId, type: 'user' });
            
            console.log(`[WebSocket] User ${registeredUserId} registriert`);
            ws.send(JSON.stringify({ 
              type: 'USER_REGISTERED', 
              userId: registeredUserId,
              message: `Willkommen zurück!`
            }));
            
            sendInitialUpdateStatus(ws);
            return;
          }

          // Neue Behandlung von USER_CONNECTED Events
          if (data.type === 'USER_CONNECTED') {
            console.log(`[WebSocket] User connected event:`, data);
            // Bestätige die Verbindung
            ws.send(JSON.stringify({
              type: 'CONNECTION_CONFIRMED',
              userId: data.userId,
              role: data.role,
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          // Fallback: Legacy Chat-Support
          const text = message.toString();
          const senderId = connectionId || 'Anonymous';
          console.log(`${senderId} (${connectionType}) sagt:`, text);
          
          // Broadcast an alle aktiven Verbindungen
          for (const [client, clientInfo] of activeConnections) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ 
                type: 'chat', 
                sender: senderId,
                senderType: connectionType,
                text 
              }));
            }
          }
          
        } catch (error) {
          // Fallback für nicht-JSON Nachrichten
          try {
            const text = message.toString();
            const senderId = connectionId || 'Anonymous';
            console.log(`${senderId} (${connectionType}) sagt:`, text);
            
            for (const [client] of activeConnections) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                  type: 'chat', 
                  sender: senderId,
                  senderType: connectionType,
                  text 
                }));
              }
            }
          } catch (e) {
            console.error('[WebSocket] Fehler beim Verarbeiten einer nicht-JSON-Nachricht:', e);
          }
        }
      });

      ws.on('close', () => {
        if (connectionType === 'user' && connectionId) {
          console.log(`[WebSocket] User ${connectionId} getrennt`);
          userConnections.delete(connectionId);
        } else {
          console.log('[WebSocket] Anonyme Verbindung getrennt');
          anonymousConnections.delete(ws);
        }
        activeConnections.delete(ws);
      });

      // Sende Initial-Message
      ws.send(JSON.stringify({ 
        type: 'system', 
        text: 'Verbunden! Sende optional Benutzer-Registrierung...' 
      }));
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, ws => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    // ─── 4. Server lauschen ───────────────────────────────────────────────────────
    server.listen(port, () => {
      console.log(`> [Server] Ready on http://localhost:${port}`);
      console.log(`> [WebSocket] Verfügbar auf ws://localhost:${port}/ws`);
    });
  })
  .catch(err => {
    console.error('[Server] Fehler in app.prepare():', err);
    process.exit(1);
  });

/**
 * NEU: Funktion um aktuellen Update-Status zu ermitteln und zu senden
 * Prüft ob derzeit ein Update verfügbar ist und sendet entsprechende Message
 */
async function sendInitialUpdateStatus(ws: WebSocket) {
  try {
    // Hier könnte man z.B. eine Datei/DB/Cache prüfen ob Updates verfügbar sind
    // Für jetzt: Einfache Logik - in Development immer Updates verfügbar machen
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // Development: Sende "kein Update" (damit nicht ständig Updates angezeigt werden)
      ws.send(JSON.stringify({
        topic: 'update-status-initial',
        payload: {
          available: false,
          reason: 'development-no-initial-update'
        }
      }));
    } else {
      // Production: Hier könnte man echte Update-Logik implementieren
      // Z.B. Build-Time vs. letzte bekannte Version prüfen
      ws.send(JSON.stringify({
        topic: 'update-status-initial',
        payload: {
          available: false,
          reason: 'no-update-available'
        }
      }));
    }
  } catch (error) {
    console.warn('[WebSocket] Fehler beim Senden des Initial-Update-Status:', error);
  }
}
