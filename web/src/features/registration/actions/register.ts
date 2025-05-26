"use server";
import { createRegistration, getRegistrationByDeviceId } from '../services/registrationService';
import { FestivalRegisterData } from '../FestivalRegisterForm';

export async function registerFestival(data: FestivalRegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    await createRegistration(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
}

/**
 * Lädt bestehende Registration-Daten für einen User
 * Verwendet nach Device Transfer um zu prüfen ob User bereits registriert ist
 */
export async function getExistingRegistration(deviceId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    return await getRegistrationByDeviceId(deviceId);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 