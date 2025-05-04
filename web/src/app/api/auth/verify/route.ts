import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/auth/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json(
        { error: 'Kein Token gefunden' },
        { status: 401 }
      );
    }

    const isValid = await verifyToken(token.value);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token-Verifizierungsfehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 