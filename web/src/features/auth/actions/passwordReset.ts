'use server';

import { sendPasswordResetEmail, resetPasswordWithToken, validatePasswordResetToken } from '../services/passwordResetService';

/**
 * Server Action: Passwort-Reset-E-Mail senden
 */
export async function sendPasswordResetAction(email: string) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Bitte gib eine gültige E-Mail-Adresse ein' };
  }

  return await sendPasswordResetEmail(email.toLowerCase().trim());
}

/**
 * Server Action: Passwort mit Token zurücksetzen
 */
export async function resetPasswordAction(token: string, newPassword: string) {
  if (!token) {
    return { success: false, error: 'Ungültiger Reset-Link' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Passwort muss mindestens 8 Zeichen lang sein' };
  }

  return await resetPasswordWithToken(token, newPassword);
}

/**
 * Server Action: Reset-Token validieren
 */
export async function validatePasswordResetTokenAction(token: string) {
  if (!token) {
    return { valid: false, error: 'Kein Token angegeben' };
  }

  return await validatePasswordResetToken(token);
} 