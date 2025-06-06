"use server";

import { User } from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';

/**
 * Prüft ob ein Username verfügbar ist
 * @param username - Username zum Prüfen
 * @returns Object mit available boolean
 */
export async function checkUsernameAvailability(username: string) {
  try {
    // Validierung
    if (!username || username.trim().length < 3) {
      return { available: false, error: 'Username muss mindestens 3 Zeichen lang sein' };
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return { available: false, error: 'Username darf nur Buchstaben, Zahlen und _ enthalten' };
    }

    await connectDB();
    
    const existingUser = await User.findByUsername(username);
    const available = !existingUser;
    
    logger.info(`[CheckUsername] Username "${username}" ${available ? 'verfügbar' : 'bereits vergeben'}`);
    
    return { 
      available,
      error: available ? null : 'Username ist bereits vergeben'
    };
    
  } catch (error) {
    logger.error('[CheckUsername] Fehler beim Prüfen des Username:', error);
    return { 
      available: false, 
      error: 'Fehler beim Prüfen des Username' 
    };
  }
} 