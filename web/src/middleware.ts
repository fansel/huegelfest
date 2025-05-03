import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

// Hilfsfunktion zur Token-Validierung
async function validateToken(token: string, request: NextRequest) {
  try {
    const response = await fetch(new URL('/api/auth/validate', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    return data.valid;
  } catch (error) {
    console.error('Token-Validierung fehlgeschlagen:', error);
    return false;
  }
}

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Login-Route Logik
  if (isLoginRoute) {
    if (authToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Admin-Route Logik
  if (isAdminRoute) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Token-Validierung
    return validateToken(authToken.value, request).then(valid => {
    if (!valid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
    });
  }

  // API-Route Logik
  if (isApiRoute) {
    const path = request.nextUrl.pathname;
    const method = request.method as HttpMethod;
    
    // Finde die passende Route-Konfiguration
    const routeConfig = Object.entries(protectedApiRoutes).find(([route]) => path.startsWith(route))?.[1];
    
    // Wenn keine geschützte Route gefunden wurde, lass die Anfrage durch
    if (!routeConfig) {
      return NextResponse.next();
    }

    // Prüfe, ob die Methode geschützt ist
    const isProtectedMethod = routeConfig.methods.includes(method);

    // Wenn es eine geschützte Methode ist und der Benutzer nicht authentifiziert ist
    if (isProtectedMethod && !authToken) {
      return new NextResponse(null, { status: 401 });
    }

    // Wenn es eine geschützte Methode ist, validiere den Token
    if (isProtectedMethod && authToken) {
      return validateToken(authToken.value, request).then(valid => {
      if (!valid) {
        return new NextResponse(null, { status: 401 });
      }
        return NextResponse.next();
      });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Konfiguriere, auf welchen Pfaden die Middleware ausgeführt werden soll
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
  runtime: 'nodejs'
}; 