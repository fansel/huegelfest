import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { User, IUser } from '@/database/models/User';
import { connectDB } from '@/database/config/connector';
import { logger } from '@/server/lib/logger';
import { getAuthConfig } from '@/server/config/auth';

// Secret wird nur bei Bedarf geladen
function getSecret() {
  const { jwtSecret } = getAuthConfig();
  return new TextEncoder().encode(jwtSecret);
}

let adminInitialized = false;

// Initialisiere den Admin-Benutzer, falls keiner existiert
export async function initializeAdmin() {
  try {
    await connectDB();
    const { adminUsername, adminPassword } = getAuthConfig();
    
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
    await jwtVerify(token, getSecret());
    return true;
  } catch (error) {
    logger.error('[Auth] Token-Verifizierung fehlgeschlagen:', error);
    return false;
  }
}

export async function validateCredentials(
  username: string,
  password: string,
): Promise<{ isValid: boolean; isAdmin: boolean; error?: string }> {
  try {
    await connectDB();
    logger.info(`[Auth] Suche Benutzer: ${username}`);

    const user = await User.findOne({ username });
    if (!user) {
      logger.warn(`[Auth] Benutzer nicht gefunden: ${username}`);
      return { isValid: false, isAdmin: false, error: 'Benutzer nicht gefunden' };
    }

    // Prüfe, ob der Account gesperrt ist
    /* 
    const isLocked = user.lockedUntil && user.lockedUntil > new Date();
    if (isLocked) {
      const remainingTime = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000 / 60);
      logger.warn(`[Auth] Account gesperrt für ${username}, noch ${remainingTime} Minuten`);
      return {
        isValid: false,
        isAdmin: false,
        error: `Account ist für ${remainingTime} Minuten gesperrt`
      };
    }
    */

    logger.info(`[Auth] Prüfe Passwort für ${username}`);
    const isValid = await compare(password, user.password);
    
    if (isValid) {
      // Erfolgreicher Login
      logger.info(`[Auth] Erfolgreicher Login für ${username}`);
      user.lastLogin = new Date();
      // user.failedLoginAttempts = 0;
      // user.lockedUntil = undefined;
      await user.save();
      
      return {
        isValid: true,
        isAdmin: user.role === 'admin'
      };
    } else {
      // Fehlgeschlagener Login
      logger.warn(`[Auth] Falsches Passwort für ${username}`);
      /* 
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      const remainingAttempts = 5 - user.failedLoginAttempts;
      let error = `Falsches Passwort. Noch ${remainingAttempts} Versuche übrig.`;

      if (user.failedLoginAttempts >= 5) {
        logger.warn(`[Auth] Account gesperrt für ${username} nach 5 fehlgeschlagenen Versuchen`);
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten Sperre
        error = 'Account wurde für 15 Minuten gesperrt.';
      }
      */
      
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
