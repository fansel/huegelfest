import type { WebSocket, WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export function setWebSocketServer(server: WebSocketServer) {
  wss = server;
  console.log('[WebSocket] Server gesetzt');
}

export async function broadcast(topic: string, payload: any) {
  if (!wss) {
    // Wenn kein WebSocket-Server gesetzt ist, versuche HTTP-POST an den internen Broadcast-Endpoint
    try {
      const res = await fetch('http://localhost:3000/internal/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, payload })
      });
      if (!res.ok) {
        console.warn('[WebSocket] Broadcast via HTTP fehlgeschlagen:', await res.text());
      } else {
        console.log('[WebSocket] Broadcast via HTTP erfolgreich ausgelöst');
      }
    } catch (err) {
      console.warn('[WebSocket] Broadcast via HTTP nicht möglich:', err);
    }
    return;
  }
  const message = JSON.stringify({ topic, payload });
  let count = 0;
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
      count++;
    }
  });
  console.log(`[WebSocket] Broadcast "${topic}" an ${count} Clients:`, message);
} 