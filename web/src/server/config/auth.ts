import { logger } from '../lib/logger';

export function getAuthConfig() {
  const config = {
    jwtSecret: process.env.JWT_SECRET || 'dummy_secret_for_build',
    adminUsername: process.env.ADMIN_USERNAME || 'dummy_admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'dummy_password'
  };

  // Validiere die Konfiguration nur in Produktion
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      logger.error('[Auth] JWT_SECRET ist nicht konfiguriert');
      throw new Error('JWT_SECRET ist nicht konfiguriert');
    }

    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      logger.error('[Auth] Admin-Zugangsdaten sind nicht konfiguriert');
      throw new Error('Admin-Zugangsdaten sind nicht konfiguriert');
    }
  }

  return config;
} 