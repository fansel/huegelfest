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

    let clientIdCounter = 1;
    const clients = new Map<WebSocket, string>();

    console.log('Initialisiere WebSocket-Server auf /ws …');
    wss.on('connection', ws => {
      const clientId = `User${clientIdCounter++}`;
      clients.set(ws, clientId);
      console.log(`${clientId} verbunden`);
      ws.send(JSON.stringify({ type: 'system', text: `Willkommen, ${clientId}!` }));

      ws.on('message', message => {
        const text = message.toString();
        console.log(`${clientId} sagt:`, text);
        for (const [client] of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'chat', sender: clientId, text }));
          }
        }
      });

      ws.on('close', () => {
        console.log(`${clientId} getrennt`);
        clients.delete(ws);
      });
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
    });
  })
  .catch(err => {
    console.error(' Fehler in app.prepare():', err);
    process.exit(1);
  });
