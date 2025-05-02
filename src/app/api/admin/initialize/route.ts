import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/auth/auth';
import { logger } from '@/server/lib/logger';

export async function POST() {
  try {
    await initializeAdmin();
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Fehler bei der Admin-Initialisierung:', error);
    return NextResponse.json(
      { error: 'Admin-Initialisierung fehlgeschlagen' },
      { status: 500 }
    );
  }
} 