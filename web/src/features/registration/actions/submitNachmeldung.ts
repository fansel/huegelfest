'use server';

import { createRegistration } from '../services/registrationService';
import { MagicCode } from '@/lib/db/models/MagicCode';
import { connectDB } from '@/lib/db/connector';
import { logger } from '@/lib/logger';
import type { FestivalRegisterData } from '../FestivalRegisterForm';

export interface NachmeldungResult {
  success: boolean;
  magicCode?: string;
  error?: string;
}

/**
 * Server Action für Nachmeldungen
 * Erstellt eine Registration erstellt und generiert einen Magic Code
 */
export async function submitNachmeldungAction(formData: FestivalRegisterData): Promise<NachmeldungResult> {
  try {
    await connectDB();

    // Verwende die bereits übergebene deviceId (wurde bereits in der NachmeldungPage generiert)
    const deviceId = formData.deviceId;
    
    if (!deviceId) {
      throw new Error('Keine Device ID vorhanden');
    }
    
    logger.info(`[Nachmeldung] Starte Nachmeldung für ${formData.name} mit deviceId: ${deviceId}`);

    // Erstelle Registration (das erstellt automatisch auch den User)
    const registration = await createRegistration(formData);
    
    if (!registration) {
      return {
        success: false,
        error: 'Fehler beim Erstellen der Anmeldung'
      };
    }

    // Erstelle Magic Code für Nachmeldung
    const magicCode = await MagicCode.createForNachmeldung(deviceId);
    
    if (!magicCode) {
      return {
        success: false,
        error: 'Fehler beim Erstellen des Anmeldecodes'
      };
    }

    logger.info(`[Nachmeldung] Nachmeldung erfolgreich für ${formData.name}, Magic Code: ${magicCode.code}`);

    return {
      success: true,
      magicCode: magicCode.code
    };

  } catch (error) {
    logger.error('[Nachmeldung] Fehler bei Nachmeldung:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Nachmeldung'
    };
  }
} 