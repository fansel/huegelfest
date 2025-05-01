import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await createUser(username, password, false);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Benutzer konnte nicht erstellt werden' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Benutzer erfolgreich erstellt' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 