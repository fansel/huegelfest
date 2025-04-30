import { NextResponse } from 'next/server';

// Speichere alle aktiven SSE-Verbindungen
const clients = new Set<ReadableStreamDefaultController>();

// Funktion zum Senden von Updates an alle verbundenen Clients
export function sendUpdateToAllClients() {
  console.log(`Sende Update an ${clients.size} Clients`);
  
  const deadClients = new Set<ReadableStreamDefaultController>();
  
  clients.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'update' })}\n\n`));
      console.log('Update erfolgreich gesendet');
    } catch (error) {
      console.error('Fehler beim Senden des Updates:', error);
      deadClients.add(controller);
    }
  });
  
  // Entferne tote Clients
  deadClients.forEach(controller => {
    removeClient(controller);
    console.log('Toter Client entfernt');
  });
}

// Funktion zum Hinzufügen eines neuen Clients
export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
  console.log(`Neuer Client hinzugefügt. Aktive Clients: ${clients.size}`);
}

// Funktion zum Entfernen eines Clients
export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
  console.log(`Client entfernt. Aktive Clients: ${clients.size}`);
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      addClient(controller);
      
      // Sende initiale Nachricht
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      console.log('Initiale Nachricht gesendet');
      
      // Cleanup bei Verbindungsabbruch
      return () => {
        removeClient(controller);
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 