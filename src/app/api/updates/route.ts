import { NextResponse } from 'next/server';

// Speichere alle aktiven SSE-Verbindungen
const clients = new Set<ReadableStreamDefaultController>();

// Funktion zum Senden von Updates an alle verbundenen Clients
export function sendUpdateToAllClients() {
  console.log(`Sende Update an ${clients.size} Clients`);
  
  const message = JSON.stringify({ type: 'update' });
  const deadClients = new Set<ReadableStreamDefaultController>();

  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
      console.log('Update erfolgreich gesendet');
    } catch (error) {
      console.error('Fehler beim Senden des Updates:', error);
      deadClients.add(client);
    }
  });

  // Entferne tote Clients
  deadClients.forEach(client => {
    clients.delete(client);
    console.log('Toter Client entfernt');
  });
}

export async function GET() {
  console.log('Neue SSE-Verbindung wird hergestellt');
  
  // Erstelle einen neuen ReadableStream für die SSE-Verbindung
  const stream = new ReadableStream({
    start(controller) {
      // Füge den Controller zur Liste der aktiven Clients hinzu
      clients.add(controller);
      console.log(`Neuer Client hinzugefügt. Aktive Clients: ${clients.size}`);

      // Sende eine initiale Nachricht
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        console.log('Initiale Nachricht gesendet');
      } catch (error) {
        console.error('Fehler beim Senden der initialen Nachricht:', error);
        clients.delete(controller);
        return;
      }

      // Entferne den Controller aus der Liste, wenn die Verbindung geschlossen wird
      return () => {
        clients.delete(controller);
        console.log(`Client entfernt. Verbleibende Clients: ${clients.size}`);
      };
    }
  });

  // Setze die entsprechenden Header für SSE
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
} 