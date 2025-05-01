import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(null, { status: 401 });
    }

    const isValid = await verifyToken(token);
    if (!isValid) {
      return new NextResponse(null, { status: 401 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Fehler bei der Auth-Prüfung:', error);
    return new NextResponse(null, { status: 500 });
  }
} 