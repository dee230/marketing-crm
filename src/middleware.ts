import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow all API routes to pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Allow static files and public assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  
  const isAuthPage = pathname.startsWith('/sign-in');
  const isPublicPage = pathname === '/' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/invoices') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/accounting');

  // If trying to access protected routes without auth, redirect to sign-in
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If already on auth page and has token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).)*',
  ],
};