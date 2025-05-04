import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/auth/auth';

// Typen für die API-Routen
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RouteConfig = {
  methods: HttpMethod[];
};

// Konfiguration der geschützten API-Routen (nur POST/PUT/DELETE)
const protectedApiRoutes: Record<string, RouteConfig> = {
  '/api/categories': {
    methods: ['POST', 'PUT', 'DELETE']
  },
  '/api/timeline': {
    methods: ['POST', 'PUT', 'DELETE']
  },
  '/api/announcements': {
    methods: ['POST', 'DELETE']
  },
  '/api/push/notify': {
    methods: ['POST']
  },
  '/api/music': {
    methods: [ 'PUT', 'DELETE']
  }
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // API-Routen Logik
  if (isApiRoute) {
    // Login-Route immer erlauben
    if (request.nextUrl.pathname === '/api/auth/login') {
      return NextResponse.next();
    }

    // Prüfe, ob die Route geschützt werden soll
    const route = request.nextUrl.pathname;
    const method = request.method as HttpMethod;
    const routeConfig = protectedApiRoutes[route];

    // Wenn die Route nicht in der Konfiguration ist oder die Methode nicht geschützt ist, erlaube den Zugriff
    if (!routeConfig || !routeConfig.methods.includes(method)) {
      return NextResponse.next();
    }

    // Für geschützte Routen Token prüfen
    if (token) {
      try {
        const isValid = await verifyToken(token);
        if (!isValid) {
          return new NextResponse(null, { status: 401 });
        }
      } catch {
        return new NextResponse(null, { status: 401 });
      }
    } else {
      return new NextResponse(null, { status: 401 });
    }
  }

  // Frontend-Routen Logik
  if (isLoginRoute) {
    // Wenn bereits eingeloggt, weiter zu Admin
    if (token) {
      try {
        const isValid = await verifyToken(token);
        if (isValid) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      } catch {
        // Token ungültig, Cookie löschen
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    // Wenn nicht eingeloggt, weiter zu Login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const isValid = await verifyToken(token);
      if (!isValid) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

// Konfiguriere, für welche Pfade die Middleware ausgeführt werden soll
export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*']
};