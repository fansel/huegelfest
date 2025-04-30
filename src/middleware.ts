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
    methods: ['POST', 'PUT', 'DELETE']
  }
};

export async function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Logging für Debugging
  console.log('Middleware - Request:', {
    path: request.nextUrl.pathname,
    method: request.method,
    isAuthenticated,
    isAdminRoute,
    isLoginRoute,
    isApiRoute
  });

  // Login-Route Logik
  if (isLoginRoute) {
    if (isAuthenticated) {
      console.log('Redirecting from login to admin');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Admin-Route Logik
  if (isAdminRoute) {
    if (!isAuthenticated) {
      console.log('Redirecting from admin to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // API-Route Logik
  if (isApiRoute) {
    const path = request.nextUrl.pathname;
    const method = request.method as HttpMethod;
    
    // Finde die passende Route-Konfiguration
    const routeConfig = Object.entries(protectedApiRoutes).find(([route]) => path.startsWith(route))?.[1];
    
    // Wenn keine geschützte Route gefunden wurde, lass die Anfrage durch
    if (!routeConfig) {
      console.log('No protected route configuration found for:', path, '- allowing request');
      return NextResponse.next();
    }

    // Prüfe, ob die Methode geschützt ist
    const isProtectedMethod = routeConfig.methods.includes(method);

    // Wenn es eine geschützte Methode ist und der Benutzer nicht authentifiziert ist
    if (isProtectedMethod && !isAuthenticated) {
      console.log('Access denied: Authentication required for:', { path, method });
      return new NextResponse(null, { status: 401 });
    }

    // Logging für API-Aufrufe
    const start = Date.now();
    const response = NextResponse.next();
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ${method} ${path} ${duration}ms`);
    
    // Detailliertes Logging für 400er Fehler
    if (response.status === 400) {
      console.error('Middleware - 400 Bad Request Details:', {
        path: request.nextUrl.pathname,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.clone().text(),
        responseTime: `${duration}ms`
      });
    }

    console.log(`Middleware - Request: {
  path: '${request.nextUrl.pathname}',
  method: '${request.method}',
  isAuthenticated: ${isAuthenticated},
  isAdminRoute: ${isAdminRoute},
  isLoginRoute: ${isLoginRoute},
  isApiRoute: ${isApiRoute}
}`);
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*'],
}; 