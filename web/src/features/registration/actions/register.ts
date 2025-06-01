"use server";
import { createRegistration, checkRegistrationStatus } from '../services/registrationService';
import type { FestivalRegisterData } from '../components/steps/types';

export async function registerFestival(data: FestivalRegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    await createRegistration(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
}



/**
 * Sichere Prüfung des Registrierungsstatus - gibt nur Status und Namen zurück
 */
export async function checkRegistrationStatusAction(deviceId: string): Promise<{ 
  isRegistered: boolean; 
  name?: string; 
  error?: string 
}> {
  try {
    return await checkRegistrationStatus(deviceId);
  } catch (error: any) {
    return { isRegistered: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 