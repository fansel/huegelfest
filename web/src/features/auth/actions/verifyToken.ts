"use server";

import { verifyToken } from '../services/authService';

export interface VerifyTokenResult {
  valid: boolean;
  payload?: any;
}

export async function verify(token: string): Promise<VerifyTokenResult> {
  const payload = await verifyToken(token);
  if (!payload) {
    return { valid: false };
  }
  return { valid: true, payload };
} 