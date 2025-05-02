import { SignJWT, jwtVerify } from 'jose';
import { SHA256 } from 'crypto-js';
import { User } from '@/database/models/User';
import mongoose from 'mongoose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production'
);

// Initialisiere den Admin-Benutzer, falls keiner existiert
export async function initializeAdmin() {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI || '');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Keine Benutzer gefunden, erstelle Admin-Benutzer...');
      const hashedPassword = SHA256('huegelfest').toString();
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        isAdmin: true
      });
      await admin.save();
      console.log('Admin-Benutzer erstellt');
    }
  } catch (error) {
    console.error('Fehler beim Initialisieren des Admin-Benutzers:', error);
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

export async function validateCredentials(username: string, password: string): Promise<{ isValid: boolean; isAdmin: boolean }> {
  try {
    console.log('Starte validateCredentials mit:', { username });
    
    if (!mongoose.connections[0].readyState) {
      console.log('MongoDB nicht verbunden, versuche zu verbinden...');
      await mongoose.connect(process.env.MONGODB_URI || '');
      console.log('MongoDB verbunden');
    }

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
      match: username === user.username
    });
    console.log('Password Hash Vergleich:', {
      eingegeben: hashedPassword,
      gespeichert: user.password,
      match: hashedPassword === user.password
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
      isAdmin: user.isAdmin 
    };
  } catch (error) {
    console.error('Fehler bei der Authentifizierung:', error);
    return { isValid: false, isAdmin: false };
  }
}

// Hilfsfunktion zum Erstellen eines neuen Benutzers
export async function createUser(username: string, password: string, isAdmin: boolean = false) {
  try {
    if (!mongoose.connections[0].readyState) {
      await mongoose.connect(process.env.MONGODB_URI || '');
    }

    const hashedPassword = SHA256(password).toString();
    const user = new User({
      username,
      password: hashedPassword,
      isAdmin
    });

    await user.save();
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    return { success: false, error: 'Benutzer konnte nicht erstellt werden' };
  }
} 