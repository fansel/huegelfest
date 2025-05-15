"use server";
import { createRegistration } from '../services/registrationService';
import { FestivalRegisterData } from '../FestivalRegisterForm';

export async function registerFestival(data: FestivalRegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    await createRegistration(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 