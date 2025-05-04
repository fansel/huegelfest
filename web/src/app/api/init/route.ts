import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/database/init';
import { logger } from '@/server/lib/logger';

export async function GET() {
  try {
    logger.info('[API/Init] Starte Initialisierung...');
    
    await initializeDatabase();
    
    logger.info('[API/Init] Initialisierung erfolgreich abgeschlossen');
    return NextResponse.json({ 
      success: true,
      message: 'Datenbank erfolgreich initialisiert'
    });
  } catch (error) {
    logger.error('[API/Init] Fehler bei der Initialisierung:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Initialisierung fehlgeschlagen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
} 