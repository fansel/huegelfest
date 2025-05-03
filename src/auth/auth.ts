import { SignJWT, jwtVerify } from 'jose';
import { SHA256 } from 'crypto-js';
import { User } from '@/database/models';
import { connectDB } from '@/database/config/connector';
import { logger } from '@/server/lib/logger';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production',
);

let adminInitialized = false;

// Initialisiere den Admin-Benutzer, falls keiner existiert
export async function initializeAdmin() {
  try {
    await connectDB();
    
    // Prüfe, ob bereits ein Admin existiert
    const adminExists = await User.findOne({ isAdmin: true });
    if (adminExists) {
      logger.info('Admin-Benutzer existiert bereits');
      return;
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    // Erstelle Admin-Benutzer
    const admin = await User.create({
      username: adminUsername,
      password: SHA256(adminPassword).toString(), // Passwort hashen
      isAdmin: true
    });

    logger.info('Admin-Benutzer erfolgreich erstellt');
    return admin;
  } catch (error) {
    logger.error('Fehler beim Initialisieren des Admin-Benutzers:', error);
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
