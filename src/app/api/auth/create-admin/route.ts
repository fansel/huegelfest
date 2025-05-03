import { NextResponse } from 'next/server';
import { createUser } from '@/auth/auth';
import { verifyToken } from '@/auth/auth';

export async function POST(request: Request) {
  try {
    // Token aus den Headers auslesen
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Token verifizieren
    const isValid = await verifyToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Admin-Benutzer erstellen
    const result = await createUser(username, password, true);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Admin konnte nicht erstellt werden' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Admin erfolgreich erstellt' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin-Erstellungsfehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 