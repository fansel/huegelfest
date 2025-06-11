// Auth-Konfiguration

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const AUTH_TOKEN_NAME = 'authToken';

export function getAuthConfig() {
  return {
    jwtSecret: JWT_SECRET,
    tokenName: AUTH_TOKEN_NAME,
    // Weitere Auth-Konfigurationen hier
  };
} 