"use server";

import { cookies } from 'next/headers';
import { verifySession } from './userAuth';

export interface VerifyTokenResult {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
}

export async function verifyToken(): Promise<VerifyTokenResult> {
  try {
    const session = await verifySession();
    if (!session) {
      return { success: false, error: 'Kein gültiger Token gefunden' };
    }
    return { success: true, isAdmin: session.role === 'admin' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Fehler bei der Token-Prüfung' };
  }
} 