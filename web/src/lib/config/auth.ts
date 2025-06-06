interface AuthConfig {
  jwtSecret: string;
  adminUsername: string;
  adminPassword: string;
}

export function getAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET || 'build-time-jwt-secret-replace-in-production'; 
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  // Only throw error in production, allow fallback values during build
  if (process.env.NODE_ENV === 'production' && (!jwtSecret || !adminUsername || !adminPassword)) {
    throw new Error('[Auth] Fehlende Umgebungsvariablen: JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD');
  }

  return {
    jwtSecret,
    adminUsername,
    adminPassword
  };
} 