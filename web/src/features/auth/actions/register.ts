"use server";

import { createUser } from '../services/authService';

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function register(
  username: string,
  password: string,
  email?: string
): Promise<RegisterResult> {
  return await createUser(username, password, 'user', email);
} 