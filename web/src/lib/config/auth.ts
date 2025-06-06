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
    throw new Error('[Auth] Fehlende Umgebungsvariablen: JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD');
  }

  return {
    jwtSecret,
    adminUsername,
    adminPassword
  };
} 