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
      const parsedUrl = parse(req.url || '', true);
      handle(req, res, parsedUrl);
    });

    // ─── 3. WebSocket-Server ─────────────────────────────────────────────────────
    const wss = new WebSocketServer({ noServer: true });
    setWebSocketServer(wss);

    // Verbessertes Client-Management mit Device-ID-Tracking
    const deviceConnections = new Map<string, WebSocket>(); // deviceId -> WebSocket
    const activeConnections = new Map<WebSocket, string>(); // WebSocket -> deviceId

    console.log('Initialisiere WebSocket-Server auf /ws …');
    wss.on('connection', ws => {
      let deviceId: string | null = null;
      
      console.log('Neue WebSocket-Verbindung eingegangen');

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
      console.log(`> Ready on http://localhost:${port}`);
      console.log(`> WebSocket verfügbar auf ws://localhost:${port}/ws`);
    });
  })
  .catch(err => {
    console.error(' Fehler in app.prepare():', err);
    process.exit(1);
  });
