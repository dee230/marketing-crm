import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in');
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/clients') ||
    request.nextUrl.pathname.startsWith('/leads') ||
    request.nextUrl.pathname.startsWith('/invoices') ||
    request.nextUrl.pathname.startsWith('/tasks');

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
  matcher: ['/dashboard/:path*', '/clients/:path*', '/leads/:path*', '/invoices/:path*', '/tasks/:path*', '/sign-in'],
};