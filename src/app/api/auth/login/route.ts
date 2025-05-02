import { NextResponse } from 'next/server';
import { generateToken, validateCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Login-Anfrage empfangen');
    const { username, password } = await request.json();
    console.log('Login-Daten:', { username, passwordLength: password?.length });

    if (!username || !password) {
      console.log('Fehlende Anmeldedaten');
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    console.log('Validiere Anmeldedaten...');
    const { isValid, isAdmin } = await validateCredentials(username, password);
    console.log('Validierungsergebnis:', { isValid, isAdmin });

    if (!isValid) {
      console.log('Ungültige Anmeldedaten für Benutzer:', username);
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    console.log('Generiere Token...');
    const token = await generateToken({ username, isAdmin });
    console.log('Token generiert');

    const response = NextResponse.json(
      { success: true, isAdmin },
      { status: 200 }
    );

    // Auth Token setzen
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 Stunden
    });
    console.log('Auth Token gesetzt');

    // isAuthenticated Cookie für Client-Side Checks
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 Stunden
    });
    console.log('isAuthenticated Cookie gesetzt');

    console.log('Login erfolgreich für Benutzer:', username);
    return response;
  } catch (error) {
    console.error('Login-Fehler:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 