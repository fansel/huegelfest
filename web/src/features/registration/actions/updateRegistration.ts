'use server';

import { updateRegistration } from '../services/registrationService';
import { IRegistration } from '@/lib/db/models/Registration';

export async function updateRegistrationAction(id: string, updates: Partial<IRegistration>) {
  try {
    return await updateRegistration(id, updates);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unbekannter Fehler' };
  }
} 