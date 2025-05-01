import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-in-production'
);

export async function generateToken(payload: any) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  return token;
}

export async function verifyToken(token: string) {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error('Token-Verifizierung fehlgeschlagen:', error);
    return false;
  }
}

export function validateCredentials(username: string, password: string): boolean {
  return username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
} 