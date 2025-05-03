import { NextResponse } from 'next/server';
import { verifyToken } from '@/auth/auth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const isValid = await verifyToken(token);
    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
} 