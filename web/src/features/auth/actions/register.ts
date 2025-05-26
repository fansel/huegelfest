"use server";

import { createSystemUser } from '../services/authService';

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function register(
  username: string,
  password: string,
  email?: string
): Promise<RegisterResult> {
  return await createSystemUser(username, password, 'systemUser', email);
} 