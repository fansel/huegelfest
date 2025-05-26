import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';
import { logger } from '@/lib/logger';
import { getAuthConfig } from '@/lib/config/auth';

function getSecret(): Uint8Array {
  const { jwtSecret } = getAuthConfig();
  return new TextEncoder().encode(jwtSecret);
}

export async function generateToken(payload: any): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
  return token;
}

export async function verifyToken(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch (error) {
    logger.error('[Auth] Token-Verifizierung fehlgeschlagen:', error);
    return null;
  }
}

export async function validateCredentials(
  username: string,
  password: string,
): Promise<{ isValid: boolean; isAdmin: boolean; error?: string }> {
  try {
    const { SystemUser } = await import('@/lib/db/models/SystemUser');
    const { connectDB } = await import('@/lib/db/connector');
    await connectDB();
    logger.info(`[Auth] Suche Benutzer: ${username}`);
    const user = await SystemUser.findOne({ systemUsername: username });
    if (!user) {
      logger.warn(`[Auth] Benutzer nicht gefunden: ${username}`);
      return { isValid: false, isAdmin: false, error: 'Benutzer nicht gefunden' };
    }
    logger.info(`[Auth] Prüfe Passwort für ${username}`);
    const isValid = await compare(password, user.password);
    if (isValid) {
      logger.info(`[Auth] Erfolgreicher Login für ${username}`);
      user.lastLogin = new Date();
      await user.save();
      return {
        isValid: true,
        isAdmin: user.role === 'admin'
      };
    } else {
      logger.warn(`[Auth] Falsches Passwort für ${username}`);
      await user.save();
      return {
        isValid: false,
        isAdmin: false,
        error: 'Falsches Passwort'
      };
    }
  } catch (error) {
    logger.error('[Auth] Fehler bei der Authentifizierung:', error);
    return {
      isValid: false,
      isAdmin: false,
      error: 'Ein Fehler ist aufgetreten'
    };
  }
}

export async function createSystemUser(
  username: string,
  password: string,
  role: 'admin' | 'systemUser' = 'systemUser',
  email?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { SystemUser } = await import('@/lib/db/models/SystemUser');
    const { connectDB } = await import('@/lib/db/connector');
    await connectDB();
    const user = new SystemUser({
      systemUsername: username,
      password, // wird automatisch gehasht durch das Model
      role,
      email
    });
    await user.save();
    return { success: true };
  } catch (error) {
    logger.error('Fehler beim Erstellen des Benutzers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Benutzer konnte nicht erstellt werden'
    };
  }
}

export async function initializeAdmin(): Promise<void> {
  try {
    const { SystemUser } = await import('@/lib/db/models/SystemUser');
    const { connectDB } = await import('@/lib/db/connector');
    const { adminUsername, adminPassword } = getAuthConfig();
    await connectDB();
    const existingAdmin = await SystemUser.findOne({ systemUsername: adminUsername });
    if (existingAdmin) {
      logger.info('[Auth] Admin-Benutzer existiert bereits');
      return;
    }
    await SystemUser.create({
      systemUsername: adminUsername,
      password: adminPassword, // wird automatisch gehasht durch das Model
      role: 'admin'
    });
    logger.info('[Auth] Admin-Benutzer erfolgreich erstellt');
  } catch (error) {
    logger.error('[Auth] Fehler beim Erstellen des Admin-Benutzers:', error);
    throw error;
  }
} 