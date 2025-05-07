import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { getAuthConfig } from '@/server/config/auth';
import { logger } from '@/server/lib/logger';

// Secret wird nur bei Bedarf geladen
function getSecret() {
  const { jwtSecret } = getAuthConfig();
  return new TextEncoder().encode(jwtSecret);
}

export async function generateToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
  return token;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch (error) {
    logger.error('[Auth] Token-Verifizierung fehlgeschlagen:', error);
    return null;
  }
}

// Diese Funktionen sollten nur in API-Routen verwendet werden
export async function validateCredentials(
  username: string,
  password: string,
): Promise<{ isValid: boolean; isAdmin: boolean; error?: string }> {
  try {
    const { User } = await import('@/database/models/User');
    const { connectDB } = await import('@/database/config/apiConnector');
    
    await connectDB();
    logger.info(`[Auth] Suche Benutzer: ${username}`);

    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`[Auth] Benutzer nicht gefunden: ${username}`);
      return { isValid: false, isAdmin: false, error: 'Benutzer nicht gefunden' };
    }

    logger.info(`[Auth] Prüfe Passwort für ${username}`);
    const isValid = await compare(password, user.password);
    
    if (isValid) {
      // Erfolgreicher Login
      logger.info(`[Auth] Erfolgreicher Login für ${username}`);
      user.lastLogin = new Date();
      await user.save();
      
      return {
        isValid: true,
        isAdmin: user.role === 'admin'
      };
    } else {
      // Fehlgeschlagener Login
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

// Hilfsfunktion zum Erstellen eines neuen Benutzers
export async function createUser(
  username: string,
  password: string,
  role: 'admin' | 'user' = 'user',
  email?: string
) {
  try {
    const { User } = await import('@/database/models/User');
    const { connectDB } = await import('@/database/config/apiConnector');
    
    await connectDB();

    const user = new User({
      username,
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

// Initialisiere den Admin-Benutzer, falls keiner existiert
export async function initializeAdmin() {
  try {
    const { User } = await import('@/database/models/User');
    const { connectDB } = await import('@/database/config/apiConnector');
    const { adminUsername, adminPassword } = getAuthConfig();
    
    await connectDB();
    
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (existingAdmin) {
      logger.info('[Auth] Admin-Benutzer existiert bereits');
      return;
    }

    await User.create({
      username: adminUsername,
      password: adminPassword, // wird automatisch gehasht durch das Model
      role: 'admin'
    });
    
    logger.info('[Auth] Admin-Benutzer erfolgreich erstellt');
  } catch (error) {
    logger.error('[Auth] Fehler beim Erstellen des Admin-Benutzers:', error);
    throw error;
  }
}
