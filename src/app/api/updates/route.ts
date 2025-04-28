import { NextResponse } from 'next/server';
import { addClient, removeClient } from '@/lib/sse';

export const dynamic = 'force-dynamic';

// Speichere alle aktiven SSE-Verbindungen

// Funktion zum Senden von Updates an alle verbundenen Clients

export async function GET() {
  console.log('Neue SSE-Verbindung wird hergestellt');
  
  // Erstelle einen neuen ReadableStream für die SSE-Verbindung
  const stream = new ReadableStream({
    start(controller) {
      // Füge den Controller zur Liste der aktiven Clients hinzu
      addClient(controller);

      // Sende eine initiale Nachricht
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        console.log('Initiale Nachricht gesendet');
      } catch (error) {
        console.error('Fehler beim Senden der initialen Nachricht:', error);
        removeClient(controller);
        return;
      }

      // Entferne den Controller aus der Liste, wenn die Verbindung geschlossen wird
      return () => {
        removeClient(controller);
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

// Exportiere die Funktion für andere Module
