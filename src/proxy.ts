import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow all API routes - NextAuth and app APIs
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Allow all static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  
  // Public pages that don't need auth
  const publicPages = ['/', '/sign-in', '/forgot-password', '/reset-password'];
  
  if (publicPages.includes(pathname)) {
    // If logged in and trying to access sign-in, redirect to dashboard
    if (pathname === '/sign-in' && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // All other pages require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

// Match all routes except static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).)*'],
};