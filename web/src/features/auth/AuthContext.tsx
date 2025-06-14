'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { loginUser, registerNewUser, logoutUser, refreshSessionAction, verifyAdminSession, becomeUserAction, restoreAdminSessionAction, isTemporaryUserSession } from './actions/userAuth';
import { unsubscribePushAction } from '@/features/push/actions/unsubscribePush';
import { useGlobalWebSocket } from '@/shared/hooks/useGlobalWebSocket';
import { authEvents, AUTH_EVENTS } from './authEvents';

/**
 * Vereinheitlichtes Auth-Context für das neue User-System
 * Unterstützt sowohl normale User als auch Admins über dasselbe Interface
 */

interface User {
  id: string;
  name: string;
  email?: string; // E-Mail ist optional
  username?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  isShadowUser?: boolean; // Shadow User Status
  groupId?: string;
  registrationId?: string;
  isActive: boolean;
}

interface UserRoleChangedPayload {
  userId: string;
  newRole: 'user' | 'admin';
}

export interface AuthContextType {
  // User State
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isTemporarySession: boolean;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Admin Actions (nur für Admins verfügbar)
  registerAdmin: (name: string, email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  
  // Become User Features
  becomeUser: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  restoreAdminSession: () => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthWebSocketHandler() {
  const { user, refreshSession } = useAuth();

  const handleWebSocketMessage = useCallback(async (message: { topic: string; payload: unknown }) => {
    console.log('[AuthContext] Received WebSocket message:', message);
    
    if (message.topic === 'user-role-changed') {
      const payload = message.payload as { userId: string; newRole: 'user' | 'admin' };
      
      if (user && payload.userId === user.id) {
        console.log('[AuthContext] Role changed for current user, refreshing session');
        await refreshSession();
      }
    }
  }, [user, refreshSession]);

  useGlobalWebSocket({
    topicFilter: ['user-role-changed'],
    onMessage: handleWebSocketMessage,
    onOpen: () => console.log('[AuthContext] WebSocket connected'),
    onClose: () => console.log('[AuthContext] WebSocket disconnected'),
    onError: (error) => console.error('[AuthContext] WebSocket error:', error)
  });

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemporarySession, setIsTemporarySession] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  // Abgeleitete States
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const oldUser = userRef.current;
      const session = await refreshSessionAction();
      
      // Check if this is a temporary session
      const tempSession = await isTemporaryUserSession();
      console.log('[AuthContext] isTemporaryUserSession result:', tempSession);
      setIsTemporarySession(tempSession);
      
      if (session) {
        console.log('[AuthContext] Session found:', session);
        setUser({
          id: session.userId,
          name: session.name,
          email: session.email,
          username: session.username,
          role: session.role,
          emailVerified: session.emailVerified,
          isShadowUser: session.isShadowUser,
          isActive: true,
        });

        // If user was demoted from admin, redirect them from admin pages
        if (oldUser?.role === 'admin' && session.role !== 'admin') {
          if (window.location.pathname.startsWith('/admin')) {
            toast.error('Ihre Admin-Berechtigungen wurden entzogen.');
            // Use smooth redirect like temporary sessions
            setTimeout(() => {
              window.location.href = '/';
            }, 1500); // Give time for toast to be read
          }
        }
      } else {
        console.log('[AuthContext] No session found');
        // If user was logged in but session is now invalid, log them out
        if (oldUser) {
          setUser(null);
          setIsTemporarySession(false);
          if (window.location.pathname.startsWith('/admin')) {
            toast.error('Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.');
            router.push('/user-login');
          }
        } else {
          setUser(null);
          setIsTemporarySession(false);
        }
      }
    } catch (error) {
      console.error('Session-Refresh fehlgeschlagen:', error);
      setUser(null);
      setIsTemporarySession(false);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Session beim Mount prüfen
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await loginUser(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsTemporarySession(false);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login fehlgeschlagen:', error);
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      const result = await registerNewUser(name, email, password, 'user', username);
      
      if (result.success) {
        // Nach erfolgreicher Registrierung direkt einloggen
        const loginResult = await loginUser(username || email, password);
        if (loginResult.success && loginResult.user) {
          setUser(loginResult.user);
          setIsTemporarySession(false);
        } else {
          console.warn('[Auth] Auto-Login nach Registrierung fehlgeschlagen:', loginResult.error);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registrierung fehlgeschlagen:', error);
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerAdmin = async (name: string, email: string, password: string, username?: string) => {
    try {
      // Nur Admins können neue Admins erstellen
      if (!isAdmin) {
        return { success: false, error: 'Keine Berechtigung für diese Aktion' };
      }

      setIsLoading(true);
      const result = await registerNewUser(name, email, password, 'admin', username);
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      console.error('Admin-Registrierung fehlgeschlagen:', error);
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Erst Server-Logout
      await logoutUser();

      // Zum Schluss lokalen State zurücksetzen
      setUser(null);
      setIsTemporarySession(false);
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      // Auch bei Fehlern den lokalen State clearen
      setUser(null);
      setIsTemporarySession(false);
    } finally {
      setIsLoading(false);
    }
  };

  const becomeUser = async (targetUserId: string) => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] becomeUser called for targetUserId:', targetUserId);
      const result = await becomeUserAction(targetUserId);
      
      if (result.success) {
        console.log('[AuthContext] becomeUser success, refreshing session...');
        await refreshSession();
        return { success: true };
      } else {
        console.log('[AuthContext] becomeUser failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Become User fehlgeschlagen:', error);
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
    } finally {
      setIsLoading(false);
    }
  };

  const restoreAdminSession = async () => {
    try {
      setIsLoading(true);
      console.log('[AuthContext] restoreAdminSession called');
      const result = await restoreAdminSessionAction();
      
      if (result.success) {
        console.log('[AuthContext] restoreAdminSession success, refreshing session...');
        await refreshSession();
        return { success: true };
      } else {
        console.log('[AuthContext] restoreAdminSession failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Restore Admin Session fehlgeschlagen:', error);
      return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    isTemporarySession,
    login,
    register,
    logout,
    refreshSession,
    registerAdmin,
    becomeUser,
    restoreAdminSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthWebSocketHandler />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  return context;
}

/**
 * Hook speziell für Admin-Bereiche
 * Gibt null zurück wenn der User kein Admin ist
 */
export function useAdminAuth() {
  const auth = useAuth();
  return auth.isAdmin ? auth : null;
}

/**
 * Hook für geschützte Admin-Sessions
 * Prüft die Session serverseitig auf Admin-Berechtigung
 */
export function useVerifiedAdminSession() {
  const [adminSession, setAdminSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const session = await verifyAdminSession();
        setAdminSession(session);
      } catch (error) {
        console.error('Admin-Session-Verifikation fehlgeschlagen:', error);
        setAdminSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  return { adminSession, isLoading };
} 