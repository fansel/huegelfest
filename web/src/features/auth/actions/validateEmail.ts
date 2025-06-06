'use server';

import { connectDB } from '@/lib/db/connector';
import { User } from '@/lib/db/models/User';
import { logger } from '@/lib/logger';

export interface EmailValidationResult {
  isAvailable: boolean;
  error?: string;
}

/**
 * Prüft ob eine E-Mail-Adresse bereits verwendet wird
 */
export async function validateEmailAvailability(email: string | undefined): Promise<EmailValidationResult> {
  try {
    // Wenn keine E-Mail angegeben wurde, ist sie "verfügbar"
    if (!email?.trim()) {
      return { isAvailable: true };
    }

    await connectDB();
    
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    return {
      isAvailable: !existingUser,
      error: existingUser ? 'Diese E-Mail-Adresse wird bereits verwendet' : undefined
    };
  } catch (error) {
    logger.error('[Auth] E-Mail-Validierung fehlgeschlagen:', error);
    return {
      isAvailable: false,
      error: 'Fehler bei der E-Mail-Validierung'
    };
  }
} 