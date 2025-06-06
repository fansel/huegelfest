'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerNewUser, logoutUser, verifySession, verifyAdminSession } from './actions/userAuth';
import { unsubscribePushAction } from '@/features/push/actions/unsubscribePush';
import type { User } from './types';

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

export interface AuthContextType {
  // User State
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Admin Actions (nur für Admins verfügbar)
  registerAdmin: (name: string, email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Abgeleitete States
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Session beim Mount prüfen
  useEffect(() => {
    refreshSession();
  }, []);

  // Listen for user-logged-in events
  useEffect(() => {
    const handleUserLoggedIn = () => {
      console.log('[AuthContext] Received user-logged-in event, refreshing session');
      refreshSession();
    };

    window.addEventListener('user-logged-in', handleUserLoggedIn);
    return () => window.removeEventListener('user-logged-in', handleUserLoggedIn);
  }, []);

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      const session = await verifySession();
      
      if (session) {
        setUser({
          id: session.userId,
          name: session.name,
          email: session.email,
          username: session.username,
          role: session.role,
          emailVerified: session.emailVerified,
          isShadowUser: session.isShadowUser,
          groupId: undefined, // Wird bei Bedarf nachgeladen
          registrationId: undefined, // Wird bei Bedarf nachgeladen
          isActive: true
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session-Refresh fehlgeschlagen:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await loginUser(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
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
    } catch (error) {
      console.error('Logout fehlgeschlagen:', error);
      // Auch bei Fehlern den lokalen State clearen
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
    refreshSession,
    registerAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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