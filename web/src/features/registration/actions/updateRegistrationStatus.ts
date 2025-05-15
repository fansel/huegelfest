'use server';
import { updateRegistrationStatus } from '../services/registrationService';

export async function updateStatus(id: string, updates: { paid?: boolean; checkedIn?: boolean }) {
  try {
    const updated = await updateRegistrationStatus(id, updates);
    return { success: true, updated };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 