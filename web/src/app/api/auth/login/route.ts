import { NextResponse } from 'next/server';
import { User } from '@/database/models/User';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { getAuthConfig } from '@/server/config/auth';
import { logger } from '@/server/lib/logger';
import { connectDB } from '@/database/config/apiConnector';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      logger.info('[Login] Fehlende Anmeldedaten');
      return NextResponse.json(
        { success: false, error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    await connectDB();
    logger.info(`[Login] Versuche Login für Benutzer: ${username}`);

    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`[Login] Benutzer nicht gefunden: ${username}`);
      return NextResponse.json(
        { success: false, error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      logger.warn(`[Login] Falsches Passwort für ${username}`);
      return NextResponse.json(
        { success: false, error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    logger.info(`[Login] Erfolgreicher Login für ${username} (${user.role === 'admin' ? 'Admin' : 'User'})`);
    
    // Token generieren
    const { jwtSecret } = getAuthConfig();
    const token = await new SignJWT({ username, isAdmin: user.role === 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(jwtSecret));

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.username,
        isAdmin: user.role === 'admin'
      }
    });

    // Setze den Auth-Cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 Stunden
    });

    return response;
  } catch (error) {
    logger.error('[Login] Unerwarteter Fehler:', error);
    return NextResponse.json(
      { success: false, error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
} 