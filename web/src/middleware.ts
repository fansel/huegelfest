import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './features/auth/services/authService';

export async function middleware(request: NextRequest) {
  console.log('MIDDLEWARE WIRD AUSGEFÜHRT', request.nextUrl.pathname);
  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  const payload = await verifyToken(token);
  if (!payload) {
    // Token ungültig oder abgelaufen
    return NextResponse.redirect(new URL('/login', request.url));
  }
  // Optional: Admin-Check
  // if (!payload.isAdmin) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'], // Schützt alle /admin-Routen
}; 