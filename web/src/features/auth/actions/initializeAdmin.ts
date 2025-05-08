"use server";

import { initializeAdmin } from '../services/authService';

export async function initAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    await initializeAdmin();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
} 