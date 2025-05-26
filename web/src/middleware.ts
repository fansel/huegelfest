import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // jose ist Edge-kompatibel

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/internal/')) {
    if (request.headers.get('host') !== 'localhost:3000 || ') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const token = request.cookies.get('authToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Optional: Admin-Check
    // if (!payload.isAdmin) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'], // Schützt alle /admin-Routen
}; 