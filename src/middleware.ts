import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
const adminPaths = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('adnan_smm_session');

  // Allow public paths
  if (publicPaths.some(p => pathname === p)) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If no session, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
