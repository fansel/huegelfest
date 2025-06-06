"use server";

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { validateCredentials, registerUser } from '../services/authService';
import { getAuthConfig } from '@/lib/config/auth';
import type { IUser } from '@/lib/db/models/User';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

const JWT_SECRET = new TextEncoder().encode(getAuthConfig().jwtSecret);
const AUTH_TOKEN_NAME = 'authToken';

/**
 * Vereinheitlichte Auth Actions für das neue User-System
 * Unterstützt sowohl normale User als auch Shadow Users
 */

/**
 * Login für alle User (normale User + Admins + Shadow Users)
 * Akzeptiert sowohl Username als auch E-Mail als Login-Identifier
 */
export async function loginUser(identifier: string, password: string) {
  try {
    const { user, error } = await validateCredentials(identifier, password);
    
    if (error || !user) {
      // Keine Server-Logs für erwartete Login-Fehler
      return { 
        success: false, 
        error: error || 'Benutzername oder Passwort stimmen nicht überein' 
      };
    }

    // JWT erstellen mit allen relevanten User-Daten
    const token = await new SignJWT({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
      isShadowUser: user.isShadowUser,
      type: 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Cookie setzen
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    // Erfolgreichen Login nur als Info loggen
    logger.info(`[Auth] User erfolgreich angemeldet: ${user.name} (${user.username || user.email}) ${user.isShadowUser ? '(Shadow User)' : ''}`);
    
    return { 
      success: true, 
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
        isShadowUser: user.isShadowUser,
        groupId: user.groupId?.toString(),
        registrationId: user.registrationId?.toString(),
        isActive: user.isActive
      }
    };
  } catch (error) {
    // Nur unerwartete Fehler loggen
    logger.error('[Auth] Unerwarteter Login-Fehler:', error);
    return { 
      success: false, 
      error: 'Ein unerwarteter Fehler ist aufgetreten' 
    };
  }
}

/**
 * Registrierung neuer User
 */
export async function registerNewUser(
  name: string,
  email: string,
  password: string,
  role: 'user' | 'admin' = 'user',
  username?: string
) {
  try {
    const user = await registerUser(name, email, password, role, username);

    return {
      success: true,
      user: {
        id: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error('Registrierungs-Fehler:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    };
  }
}

/**
 * Session validieren
 */
export async function verifySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;
    
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Type Guard für User-Token
    if (payload.type !== 'user' || !payload.userId || !payload.role) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as 'user' | 'admin',
      emailVerified: payload.emailVerified as boolean,
      isShadowUser: payload.isShadowUser as boolean // Shadow User Status
    };
  } catch (error) {
    console.error('Session-Validierung fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Logout
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN_NAME);
    return { success: true };
  } catch (error) {
    console.error('Logout fehlgeschlagen:', error);
    throw error;
  }
}

/**
 * Admin-Check für geschützte Admin-Bereiche
 */
export async function verifyAdminSession() {
  const session = await verifySession();
  return session && session.role === 'admin' ? session : null;
} 