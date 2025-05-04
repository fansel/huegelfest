import { NextResponse } from 'next/server';
import { initializeServices } from '@/server/lib/init';
import { logger } from '@/server/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  logger.info('[API/Init] Initialisierungsanfrage erhalten');

  try {
    await initializeServices();
    return NextResponse.json({ 
      status: 'success',
      message: 'Services erfolgreich initialisiert',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[API/Init] Fehler bei der Initialisierung:', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Fehler bei der Service-Initialisierung',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 