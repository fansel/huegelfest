import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/auth/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const isValid = await verifyToken(token.value);
    return NextResponse.json({ isAuthenticated: isValid });
  } catch (error) {
    console.error('Auth-Check-Fehler:', error);
    return NextResponse.json({ isAuthenticated: false });
  }
} 