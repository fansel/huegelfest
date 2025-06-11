"use server";

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { validateCredentials, registerUser, getUserById } from '../services/authService';
import { getAuthConfig, AUTH_TOKEN_NAME } from '@/lib/config/auth';
import type { IUser } from '@/lib/db/models/User';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

const JWT_SECRET = new TextEncoder().encode(getAuthConfig().jwtSecret);

/**
 * Internal helper to verify a token and fetch the latest user data from the DB.
 * Does not handle cookies.
 * @param token The JWT string.
 * @returns The user object from the DB, or null if invalid.
 */
async function getVerifiedUserFromToken(token: string | undefined) {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'user' || typeof payload.userId !== 'string') {
      return null;
    }
    const user = await getUserById(payload.userId);
    return user; // Will be a lean object or null
  } catch (error) {
    logger.warn('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Vereinheitlichte Auth Actions für das neue User-System
 * Unterstützt sowohl normale User als auch Shadow Users
 */

/**
 * Login for all user types. This is a write action (sets a cookie).
 */
export async function loginUser(identifier: string, password: string) {
  try {
    const { user, error } = await validateCredentials(identifier, password);
    
    if (error || !user) {
      return { success: false, error: error || 'Benutzername oder Passwort stimmen nicht überein' };
    }

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

    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    logger.info(`[Auth] User erfolgreich angemeldet: ${user.name} (${user.username || user.email})`);
    
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(user)) // Return a plain object
    };
  } catch (error) {
    logger.error('[Auth] Unerwarteter Login-Fehler:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Registers a new user. This is a read/write DB action, but not a cookie action.
 */
export async function registerNewUser(
  name: string,
  email: string,
  password: string,
  role: 'user' | 'admin' = 'user',
  username?: string
) {
  try {
    const user = await registerUser(name, username || email, password, role, email);
    return {
      success: true,
      user: JSON.parse(JSON.stringify(user)) // Return a plain object
    };
  } catch (error) {
    logger.error('Registrierungs-Fehler:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    };
  }
}

/**
 * Verifies the session from the cookie. READ-ONLY.
 * Safe to be called from Server Components. Does not refresh the token.
 */
export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;
  const user = await getVerifiedUserFromToken(token);
  
  if (!user) {
    return null;
  }
  
  return {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
    isShadowUser: user.isShadowUser
  };
}

/**
 * Refreshes the session token. WRITE operation for cookies.
 * This should ONLY be called from a client-side interaction.
 */
export async function refreshSessionAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;
  
  if (!token) {
    return null;
  }

  try {
    // First verify the current token and get its payload
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = await getVerifiedUserFromToken(token);

    if (!user) {
      cookieStore.delete(AUTH_TOKEN_NAME);
      return null;
    }

    // Create new token payload with fresh user data
    const newTokenPayload: any = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
      isShadowUser: user.isShadowUser,
      type: 'user'
    };

    // Preserve originalAdmin if this is a temporary session
    if (payload.originalAdmin) {
      console.log('[refreshSessionAction] Preserving originalAdmin in refresh:', payload.originalAdmin);
      newTokenPayload.originalAdmin = payload.originalAdmin;
    }

    // Issue a new token with fresh data (and preserved originalAdmin if applicable)
    const newToken = await new SignJWT(newTokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(payload.originalAdmin ? '2h' : '7d') // Shorter expiration for temporary sessions
      .sign(JWT_SECRET);

    cookieStore.set(AUTH_TOKEN_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: payload.originalAdmin ? 60 * 60 * 2 : 60 * 60 * 24 * 7 // 2 hours for temp sessions, 7 days for normal
    });

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
      isShadowUser: user.isShadowUser
    };
  } catch (error) {
    console.log('[refreshSessionAction] Error:', error);
    cookieStore.delete(AUTH_TOKEN_NAME);
    return null;
  }
}

/**
 * Logs out the user. This is a write action (deletes a cookie).
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN_NAME);
    return { success: true };
  } catch (error) {
    logger.error('Logout fehlgeschlagen:', error);
    throw error;
  }
}

/**
 * Admin-Check for protected admin areas. Uses the read-only verifySession.
 */
export async function verifyAdminSession() {
  const session = await verifySession();
  return session && session.role === 'admin' ? session : null;
}

/**
 * Allows an admin to temporarily become a user (for testing user experience)
 * This creates a temporary user session while preserving admin session info in metadata
 */
export async function becomeUserAction(targetUserId: string) {
  try {
    console.log('[becomeUserAction] Starting, targetUserId:', targetUserId);
    // First verify the current user is an admin
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      console.log('[becomeUserAction] No admin session found');
      return { success: false, error: 'Admin-Berechtigung erforderlich' };
    }

    console.log('[becomeUserAction] Admin session:', adminSession);

    // Get the target user
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      console.log('[becomeUserAction] Target user not found');
      return { success: false, error: 'Zielbenutzer nicht gefunden' };
    }

    console.log('[becomeUserAction] Target user found:', targetUser.name);

    // Create a new token with the target user's data, but include admin metadata
    const tokenPayload = {
      userId: targetUser._id.toString(),
      email: targetUser.email,
      name: targetUser.name,
      username: targetUser.username,
      role: targetUser.role,
      emailVerified: targetUser.emailVerified,
      isShadowUser: targetUser.isShadowUser,
      type: 'user',
      // Include original admin info for restoration
      originalAdmin: {
        userId: adminSession.userId,
        email: adminSession.email,
        name: adminSession.name,
        username: adminSession.username
      }
    };
    
    console.log('[becomeUserAction] Creating token with payload:', tokenPayload);
    
    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h') // Shorter expiration for security
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    console.log('[becomeUserAction] Token set successfully');
    logger.info(`[Auth] Admin ${adminSession.name} became user ${targetUser.name}`);
    
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(targetUser)),
      isTemporarySession: true
    };
  } catch (error) {
    console.log('[becomeUserAction] Error:', error);
    logger.error('[Auth] Fehler bei becomeUser:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Restores the original admin session from a temporary user session
 */
export async function restoreAdminSessionAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;
    
    if (!token) {
      return { success: false, error: 'Keine aktive Session gefunden' };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if this is a temporary session with original admin data
    if (!payload.originalAdmin || typeof payload.originalAdmin !== 'object') {
      return { success: false, error: 'Keine temporäre Session gefunden' };
    }

    const originalAdmin = payload.originalAdmin as any;
    
    // Get fresh admin data
    const adminUser = await getUserById(originalAdmin.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return { success: false, error: 'Original-Admin nicht mehr gültig' };
    }

    // Create new admin token
    const newToken = await new SignJWT({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      name: adminUser.name,
      username: adminUser.username,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified,
      isShadowUser: adminUser.isShadowUser,
      type: 'user'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    cookieStore.set(AUTH_TOKEN_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    logger.info(`[Auth] Restored admin session for ${adminUser.name}`);
    
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(adminUser))
    };
  } catch (error) {
    logger.error('[Auth] Fehler bei restoreAdminSession:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Checks if the current session is a temporary admin->user session
 */
export async function isTemporaryUserSession() {
  try {
    console.log('[isTemporaryUserSession] Starting check...');
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_TOKEN_NAME)?.value;
    
    if (!token) {
      console.log('[isTemporaryUserSession] No token found');
      return false;
    }

    console.log('[isTemporaryUserSession] Token found, verifying...');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('[isTemporaryUserSession] Payload:', payload);
    console.log('[isTemporaryUserSession] originalAdmin:', payload.originalAdmin);
    console.log('[isTemporaryUserSession] Result:', !!payload.originalAdmin);
    
    return !!payload.originalAdmin;
  } catch (error) {
    console.log('[isTemporaryUserSession] Error:', error);
    return false;
  }
} 