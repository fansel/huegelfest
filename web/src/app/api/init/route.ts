import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/database/init';
import { logger } from '@/server/lib/logger';

export async function GET() {
  try {
    await initializeDatabase();
    logger.info('[API] Initialisierung erfolgreich');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Fehler bei der Initialisierung:', error);
    return NextResponse.json({ error: 'Initialisierung fehlgeschlagen' }, { status: 500 });
  }
} 