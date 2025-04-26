import { NextResponse } from 'next/server';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Sende initiale Daten
      const sendData = () => {
        const data = {
          type: 'update',
          timestamp: new Date().toISOString()
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Sende alle 30 Sekunden ein Update
      const interval = setInterval(sendData, 30000);

      // Cleanup
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 