// server.ts
import  './src/lib/pushScheduler/agenda.js';
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
export const deviceConnections = new Map<string, WebSocket>(); // deviceId -> WebSocket
export const activeConnections = new Map<WebSocket, string>(); // WebSocket -> deviceId

// Function to get current WebSocket statistics
export function getWebSocketStats() {
  const connectionsByDevice = new Map<string, number>();
  const activeDevices: Array<{deviceId: string, connected: boolean, readyState: number}> = [];
  
  for (const [deviceId, ws] of deviceConnections) {
    const count = connectionsByDevice.get(deviceId) || 0;
    connectionsByDevice.set(deviceId, count + 1);
    
    activeDevices.push({
      deviceId,
      connected: ws.readyState === WebSocket.OPEN,
      readyState: ws.readyState
    });
  }
  
  return {
    totalConnections: activeConnections.size,
    totalDevices: deviceConnections.size,
    devicesList: activeDevices,
    connectionsByDevice: Object.fromEntries(connectionsByDevice)
  };
}

app
  .prepare()
  .then(async () => {

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

    // Verbessertes Client-Management mit Device-ID-Tracking
    console.log('[WebSocket] Initialisiere WebSocket-Server auf /ws …');
    wss.on('connection', ws => {
      let deviceId: string | null = null;
      
      console.log('[WebSocket] Neue Verbindung eingegangen');

      ws.on('message', message => {
        try {
          const data = JSON.parse(message.toString());
          
          // Prüfe auf Device-ID Registration
          if (data.type === 'DEVICE_REGISTRATION' && data.deviceId && typeof data.deviceId === 'string') {
            const registeredDeviceId = data.deviceId; // String-Typ gesichert
            deviceId = registeredDeviceId;
            
            // Prüfe ob Device bereits verbunden ist
            const existingConnection = deviceConnections.get(registeredDeviceId);
            if (existingConnection && existingConnection.readyState === WebSocket.OPEN) {
              console.log(`[WebSocket] Device ${registeredDeviceId} bereits verbunden - schließe alte Verbindung`);
              existingConnection.close();
            }
            
            // Registriere neue Verbindung
            deviceConnections.set(registeredDeviceId, ws);
            activeConnections.set(ws, registeredDeviceId);
            
            console.log(`[WebSocket] Device ${registeredDeviceId} registriert`);
            ws.send(JSON.stringify({ 
              type: 'DEVICE_REGISTERED', 
              deviceId: registeredDeviceId,
              message: `Willkommen zurück, ${registeredDeviceId}!`
            }));
            
            // NEU: Sofort aktuellen Update-Status senden
            sendInitialUpdateStatus(ws);
            return;
          }
          
          // Fallback: Legacy Chat-Support
          const text = message.toString();
          const senderId = deviceId || 'Anonymous';
          console.log(`${senderId} sagt:`, text);
          
          // Broadcast an alle aktiven Verbindungen
          for (const [client, clientDeviceId] of activeConnections) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ 
                type: 'chat', 
                sender: senderId, 
                text 
              }));
            }
          }
          
        } catch (error) {
          // Fallback für nicht-JSON Nachrichten
          const text = message.toString();
          const senderId = deviceId || 'Anonymous';
          console.log(`${senderId} sagt:`, text);
          
          for (const [client] of activeConnections) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ 
                type: 'chat', 
                sender: senderId, 
                text 
              }));
            }
          }
        }
      });

      ws.on('close', () => {
        if (deviceId) {
          console.log(`[WebSocket] Device ${deviceId} getrennt`);
          deviceConnections.delete(deviceId);
        } else {
          console.log('[WebSocket] Anonyme Verbindung getrennt');
        }
        activeConnections.delete(ws);
      });

      // Sende Initial-Message
      ws.send(JSON.stringify({ 
        type: 'system', 
        text: 'Verbunden! Sende Device-Registrierung...' 
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
