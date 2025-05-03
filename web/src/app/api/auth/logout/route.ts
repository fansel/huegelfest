import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Cookies in der Response löschen
    response.cookies.delete('auth_token');
    response.cookies.delete('isAuthenticated');
    
    return response;
  } catch (error) {
    console.error('Logout-Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 