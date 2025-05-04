import { logger } from '@/server/lib/logger';

interface AuthConfig {
  jwtSecret: string;
  adminUsername: string;
  adminPassword: string;
}

export function getAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!jwtSecret || !adminUsername || !adminPassword) {
    logger.error('[Auth] Fehlende Umgebungsvariablen');
    throw new Error('Fehlende Konfiguration');
  }

  return {
    jwtSecret,
    adminUsername,
    adminPassword
  };
} 