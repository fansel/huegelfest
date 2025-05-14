import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { setWebSocketServer } from './src/lib/websocket/broadcast.js';
import { broadcast } from './src/lib/websocket/broadcast.js';

const port: number = parseInt(process.env.PORT || '3000', 10);
const dev: boolean = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    // Interner Broadcast-Endpoint
    if (req.method === 'POST' && req.url === '/internal/broadcast') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
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

  // WebSocket-Server auf separatem Pfad /ws
  const wss = new WebSocketServer({ noServer: true });
  setWebSocketServer(wss);

  let clientIdCounter = 1;
  const clients = new Map<WebSocket, string>();

  console.log('Initialisiere WebSocket-Server auf /ws ...');
  wss.on('connection', (ws: WebSocket) => {
    const clientId = `User${clientIdCounter++}`;
    clients.set(ws, clientId);
    console.log(`${clientId} verbunden`);

    ws.send(JSON.stringify({ type: 'system', text: `Willkommen, ${clientId}!` }));

    ws.on('close', () => {
      console.log(`${clientId} getrennt`);
      clients.delete(ws);
      // Optional: Broadcast, dass jemand gegangen ist
    });

    ws.on('message', (message) => {
      const text = typeof message === 'string' ? message : message.toString();
      console.log(`${clientId} sagt:`, text);
      // Broadcast an alle Clients
      for (const [client, name] of clients.entries()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'chat',
            sender: clientId,
            text,
          }));
        }
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`> Ready on http://localhost:${port}`);
  });
}); 