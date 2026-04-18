import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
    return new TextEncoder().encode(secret);
  };

  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecretKey());
      isAuthenticated = true;
    } catch (err) {
      // Invalid token
    }
  }

  // Define protected paths
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname);

  // If hitting login/register but already authenticated, redirect to /
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If hitting a protected route but NOT authenticated
  if (!isAuthRoute && !isAuthenticated && !request.nextUrl.pathname.startsWith('/api/auth') && !request.nextUrl.pathname.startsWith('/_next') && request.nextUrl.pathname !== '/favicon.ico') {
    // Return unauthorized for APIs, redirect for UI
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|uploads).*)'],
};
