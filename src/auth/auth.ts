import { SignJWT, jwtVerify } from 'jose';
import { SHA256 } from 'crypto-js';
import User from '@/database/models/User';
import { connectDB } from '@/database/config/connector';
import { logger } from '@/server/lib/logger';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production',
);

let adminInitialized = false;

// Initialisiere den Admin-Benutzer, falls keiner existiert
export async function initializeAdmin() {
  if (adminInitialized) {
    logger.info('[Auth] Admin-Initialisierung bereits durchgeführt');
    return;
  }

  try {
    logger.info('[Auth] Starte Initialisierung des Admin-Benutzers');
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('[Auth] Keine Benutzer gefunden, erstelle Admin-Benutzer');
      
      // Prüfe ob Umgebungsvariablen gesetzt sind
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        logger.error('[Auth] ADMIN_USERNAME oder ADMIN_PASSWORD nicht in Umgebungsvariablen definiert');
        throw new Error('Admin-Credentials nicht konfiguriert');
      }

      const hashedPassword = SHA256(adminPassword).toString();
      const admin = new User({
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
      });
      
      await admin.save();
      logger.info('[Auth] Admin-Benutzer erfolgreich erstellt');
    } else {
      logger.info('[Auth] Admin-Benutzer existiert bereits');
    }

    adminInitialized = true;
  } catch (error) {
    logger.error('[Auth] Kritischer Fehler beim Initialisieren des Admin-Benutzers:', error);
    throw error;
  }
}

export async function generateToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return token;
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error('Token-Verifizierung fehlgeschlagen:', error);
    return false;
  }
}

export async function validateCredentials(
  username: string,
  password: string,
): Promise<{ isValid: boolean; isAdmin: boolean }> {
  try {
    console.log('Starte validateCredentials mit:', { username });

    await connectDB();

    // Benutzer in der Datenbank suchen
    console.log('Suche Benutzer in der Datenbank...');
    const user = await User.findOne({ username }).exec();
    console.log('Gefundener Benutzer:', user ? 'Ja' : 'Nein');

    if (!user) {
      console.log('Benutzer nicht gefunden:', username);
      return { isValid: false, isAdmin: false };
    }

    // Passwort hashen und vergleichen
    const hashedPassword = SHA256(password).toString();

    // Debug-Logging
    console.log('Login-Versuch:');
    console.log('Username Vergleich:', {
      eingegeben: username,
      gefunden: user.username,
      match: username === user.username,
    });
    console.log('Password Hash Vergleich:', {
      eingegeben: hashedPassword,
      gespeichert: user.password,
      match: hashedPassword === user.password,
    });

    // Passwort-Hash vergleichen
    const isValid = hashedPassword === user.password;
    console.log('Passwort-Validierung:', { isValid });

    if (isValid) {
      // LastLogin aktualisieren
      user.lastLogin = new Date();
      await user.save();
      console.log('LastLogin aktualisiert');
    }

    return {
      isValid,
      isAdmin: user.isAdmin,
    };
  } catch (error) {
    console.error('Fehler bei der Authentifizierung:', error);
    return { isValid: false, isAdmin: false };
  }
}

// Hilfsfunktion zum Erstellen eines neuen Benutzers
export async function createUser(
  username: string,
  password: string,
  isAdmin: boolean = false,
) {
  try {
    await connectDB();

    const hashedPassword = SHA256(password).toString();
    const user = new User({
      username,
      password: hashedPassword,
      isAdmin,
    });

    await user.save();
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    return { success: false, error: 'Benutzer konnte nicht erstellt werden' };
  }
}
