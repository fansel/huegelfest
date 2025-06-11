/**
 * Sendet eine WebSocket-Nachricht an alle verbundenen Clients
 * @param topic - Das Topic der Nachricht
 * @param payload - Die Payload der Nachricht
 */
export async function broadcastWebSocketMessage(topic: string, payload: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WS_URL}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, payload }),
    });

    if (!response.ok) {
      throw new Error(`WebSocket-Broadcast fehlgeschlagen: ${response.statusText}`);
    }

    console.log(`[WebSocket] Broadcast "${topic}" erfolgreich gesendet:`, payload);
  } catch (error) {
    console.error('[WebSocket] Broadcast-Fehler:', error);
    throw error;
  }
} 