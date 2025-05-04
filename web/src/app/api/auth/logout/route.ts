import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Erstelle die Response mit dem JSON-Body
    const response = NextResponse.json(
      { success: true, message: 'Erfolgreich ausgeloggt' },
      { status: 200 }
    );
    
    // Lösche den Auth-Token Cookie
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Fehler beim Ausloggen:', error);
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 