'use server';

import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import type { FestivalRegisterData } from '../components/steps/types';
import { createLateRegistration } from '../services/registrationService';

export interface NachmeldungResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action für Nachmeldungen
 * Erstellt eine neue Registration und einen neuen Account
 * OHNE automatischen Login
 */
export async function submitNachmeldungAction(formData: FestivalRegisterData & { username?: string, password?: string }): Promise<NachmeldungResult> {
  try {
    await connectDB();

    logger.info(`[Nachmeldung] Starte Nachmeldung für ${formData.name}`);

    // Prüfe ob username und password vorhanden sind
    if (!formData.username || !formData.password) {
      return {
        success: false,
        error: 'Username und Passwort sind erforderlich'
      };
    }

    // Erstelle Registration und User Account
    const registration = await createLateRegistration({
      ...formData,
      username: formData.username,
      password: formData.password
    });
    logger.info(`[Nachmeldung] Registration erstellt: ${registration._id}`);

    return {
      success: true
    };

  } catch (error) {
    logger.error('[Nachmeldung] Fehler bei Nachmeldung:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Nachmeldung'
    };
  }
} 