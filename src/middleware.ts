import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/login';

  console.log('Middleware - isAuthenticated:', isAuthenticated);
  console.log('Middleware - isAdminRoute:', isAdminRoute);
  console.log('Middleware - isLoginRoute:', isLoginRoute);
  console.log('Middleware - URL:', request.nextUrl.pathname);

  // Wenn auf der Login-Seite und bereits authentifiziert, weiterleiten zu /admin
  if (isLoginRoute && isAuthenticated) {
    console.log('Redirecting from login to admin');
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Wenn auf einer Admin-Route und nicht authentifiziert, weiterleiten zu /login
  if (isAdminRoute && !isAuthenticated) {
    console.log('Redirecting from admin to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Wenn authentifiziert und auf einer Admin-Route, erlaube den Zugriff
  if (isAdminRoute && isAuthenticated) {
    console.log('Allowing access to admin route');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}; 