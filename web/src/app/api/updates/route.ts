import { sseService } from '@/server/lib/sse';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/server/lib/logger';

export const dynamic = 'force-dynamic';
// Entferne die nodejs Runtime-Beschränkung für bessere Edge-Kompatibilität
// export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  logger.info('[SSE] Neue Verbindung wird hergestellt');
  
  try {
    const response = sseService.createResponse();
    logger.info('[SSE] Verbindung erfolgreich hergestellt');
    return response;
  } catch (error) {
    logger.error('[SSE] Fehler beim Erstellen der SSE-Verbindung:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
  try {
    logger.info('[SSE] Empfange Update-Anfrage');
    sseService.sendUpdateToAllClients();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[SSE] Fehler beim Senden des Updates:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
