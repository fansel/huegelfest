"use server";

import { cookies } from 'next/headers';
import { verifyToken as verifyTokenService } from '../services/authService';

export interface VerifyTokenResult {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
}

export async function verifyToken(): Promise<VerifyTokenResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token) {
      return { success: false, error: 'Kein Token gefunden' };
    }
    const payload = await verifyTokenService(token);
    if (!payload) {
      return { success: false, error: 'Token ungültig' };
    }
    return { success: true, isAdmin: !!payload.isAdmin };
  } catch (error: any) {
    return { success: false, error: error.message || 'Fehler bei der Token-Prüfung' };
  }
} 