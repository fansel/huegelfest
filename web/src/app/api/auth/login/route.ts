import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCookieConfig } from '@/server/config/cookies';
import { SignJWT } from 'jose';
import { getAuthConfig } from '@/server/config/auth';
import { User } from '@/database/models/User';
import { compare } from 'bcrypt';
import { logger } from '@/server/lib/logger';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const { jwtSecret } = getAuthConfig();
    const token = await new SignJWT({ userId: user._id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(jwtSecret));

    const cookieConfig = getCookieConfig();
    cookies().set(cookieConfig.name, token, cookieConfig.options);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Auth] Login-Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
} 