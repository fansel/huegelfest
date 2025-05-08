'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginAction } from './actions/login';
import { logout as logoutAction } from './actions/logout';
import { cookies } from 'next/headers';

// Typen für den Auth-Status
export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider stellt den Authentifizierungsstatus und die Login/Logout-Methoden global bereit.
 * - isAuthenticated: true, wenn ein gültiger Token vorhanden ist
 * - isAdmin: true, wenn der User Adminrechte hat
 * - login: führt Login über Server Action aus
 * - logout: entfernt Auth-Token
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initiale Auth-Prüfung (z.B. per API/Server-Action)
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Prüfe Token/Session via Server Action (z.B. verifyToken)
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setIsAdmin(!!data.isAdmin);
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch {
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login-Methode
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginAction(username, password);
      if (result.success) {
        setIsAuthenticated(true);
        setIsAdmin(!!result.isAdmin);
      } else {
        setError(result.error || 'Login fehlgeschlagen');
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } catch (err: any) {
      setError(err.message || 'Login fehlgeschlagen');
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Logout-Methode
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutAction();
    } finally {
      setIsAuthenticated(false);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook für einfachen Zugriff auf den AuthContext
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  return context;
} 