import { logger } from '../lib/logger';

export function getAuthConfig() {
  const config = {
    jwtSecret: process.env.JWT_SECRET,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD
  };

  // Validiere die Konfiguration
  if (!config.jwtSecret) {
    logger.error('[Auth] JWT_SECRET ist nicht konfiguriert');
    throw new Error('JWT_SECRET ist nicht konfiguriert');
  }

  if (!config.adminUsername || !config.adminPassword) {
    logger.error('[Auth] Admin-Zugangsdaten sind nicht konfiguriert');
    throw new Error('Admin-Zugangsdaten sind nicht konfiguriert');
  }

  return config;
} 