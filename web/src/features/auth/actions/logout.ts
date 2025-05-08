"use server";
import { cookies } from 'next/headers';

export async function logout() {
  const cookiesStore = cookies();
  cookiesStore.set('authToken', '', { maxAge: 0, path: '/' });
} 