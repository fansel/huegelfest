"use server";
import { 
  createRegistration, 
  getCurrentUserRegistration, 
  checkCurrentUserRegistrationStatus 
} from '../services/registrationService';
import type { FestivalRegisterData } from '../components/steps/types';
import { logger } from '@/lib/logger';
import { broadcast } from '@/lib/websocket/broadcast';

/**
 * Modernisierte Registration Actions - verwendet das neue Auth-System
 */

export async function registerFestival(data: FestivalRegisterData) {
  try {
    logger.info(`[RegisterAction] Starte Festival-Registrierung für: ${data.name}`);
    
    const registration = await createRegistration(data);
    
    if (registration) {
      // WebSocket-Broadcast für alle Clients
      await broadcast('registration-created', { 
        registrationId: registration._id?.toString(),
        userName: data.name 
      });
      
      logger.info(`[RegisterAction] Registration erfolgreich erstellt: ${registration._id}`);
      return { success: true, registration };
    } else {
      return { success: false, error: 'Fehler beim Erstellen der Registrierung' };
    }
  } catch (error) {
    logger.error('[RegisterAction] Fehler bei Festival-Registrierung:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Registrierung' 
    };
  }
}

/**
 * Lädt Registration-Daten für den aktuell eingeloggten User
 */
export async function getUserRegistrationAction() {
  try {
    return await getCurrentUserRegistration();
  } catch (error) {
    logger.error('[RegisterAction] Fehler beim Laden der User-Registration:', error);
    return { success: false, error: 'Fehler beim Laden der Registrierung' };
  }
}

/**
 * Prüft ob der aktuelle User bereits registriert ist
 */
export async function checkRegistrationStatusAction() {
  try {
    return await checkCurrentUserRegistrationStatus();
  } catch (error) {
    logger.error('[RegisterAction] Fehler beim Prüfen des Registrierungsstatus:', error);
    return { isRegistered: false, error: 'Fehler beim Prüfen des Status' };
  }
} 