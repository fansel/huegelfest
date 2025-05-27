import { NextResponse } from 'next/server';

/**
 * Einfacher Health-Check Endpoint für Verbindungsüberprüfung
 * Liefert HTTP 200 ohne Content, optimiert für minimale Größe
 */
export async function GET() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

/**
 * HEAD-Methode für effizientere Netzwerkanfragen
 * Enthält nur Header, keinen Body
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
} 