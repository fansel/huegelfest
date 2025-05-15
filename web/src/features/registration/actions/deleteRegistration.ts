'use server';
import { deleteRegistration as deleteRegistrationService } from '../services/registrationService';

export async function deleteRegistration(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await deleteRegistrationService(id);
    if (!ok) return { success: false, error: 'Nicht gefunden oder bereits gelöscht.' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 