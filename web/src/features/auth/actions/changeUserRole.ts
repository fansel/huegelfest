'use server';

import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { changeUserRole as changeUserRoleService } from '../services/authService';
import { verifyAdminSession } from './userAuth';
import { broadcastWebSocketMessage } from '@/shared/websocket/broadcastMessage';
import { JWT_SECRET, AUTH_TOKEN_NAME } from '@/lib/config/auth';

const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export async function changeUserRole(userId: string, newRole: 'user' | 'admin') {
  try {
    // Prüfe Admin-Berechtigung
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      throw new Error('Keine Admin-Berechtigung');
    }

    // Rolle in der Datenbank ändern
    const updatedUser = await changeUserRoleService(userId, newRole);

    // WebSocket-Broadcast senden
    await broadcastWebSocketMessage('user-role-changed', {
      userId,
      newRole
    });

    // Wenn der User, dessen Rolle geändert wurde, der aktuelle User ist,
    // aktualisiere sein Token
    if (userId === adminSession.userId) {
      const newToken = await new SignJWT({
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
        isShadowUser: updatedUser.isShadowUser,
        type: 'user'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET_BYTES);

      // Cookie aktualisieren (Next.js 14+ Cookie API)
      const cookieStore = await cookies();
      cookieStore.set({
        name: AUTH_TOKEN_NAME,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Fehler beim Ändern der User-Rolle:', error);
    return { success: false, error: 'Ein Fehler ist aufgetreten' };
  }
} 