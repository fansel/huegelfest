"use server";

import { cookies } from 'next/headers';
import { validateCredentials, generateToken } from '../services/authService';

export interface LoginResult {
  success: boolean;
  isAdmin?: boolean;
  error?: string;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const result = await validateCredentials(username, password);
  if (!result.isValid) {
    return { success: false, error: result.error };
  }
  const token = await generateToken({ username, isAdmin: result.isAdmin });
  const cookiesStore = await cookies();
  cookiesStore.set('authToken', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 Tag
    secure: process.env.NODE_ENV === 'production',
  });
  return { success: true, isAdmin: result.isAdmin };
} 