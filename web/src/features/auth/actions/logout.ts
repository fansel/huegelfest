"use server";
import { cookies } from 'next/headers';

export async function logout() {
  const cookiesStore = await cookies();
  cookiesStore.set('authToken', '', { maxAge: 0, path: '/' });
} 