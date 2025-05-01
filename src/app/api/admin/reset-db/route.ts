import { NextResponse } from 'next/server';
import { resetDatabase } from '@/database/init/resetDatabase';
import { initLogger } from '@/database/init/logger';

export async function POST() {
  // Nur im Development-Modus erlauben
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Diese Funktion ist nur im Development-Modus verfügbar' },
      { status: 403 }
    );
  }

  try {
    initLogger.info('Starte Datenbank-Reset über API...');
    await resetDatabase();
    return NextResponse.json({ success: true });
  } catch (error) {
    initLogger.error('Fehler beim Datenbank-Reset über API:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen der Datenbank' },
      { status: 500 }
    );
  }
} 