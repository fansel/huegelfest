import { getAuthConfig } from './auth';

export function getCookieConfig() {
  const { jwtSecret } = getAuthConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    name: 'huegelfest_session',
    secret: jwtSecret,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 Tage
    }
  };
} 