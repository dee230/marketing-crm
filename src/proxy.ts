import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Allow ALL API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  
  const isAuthPage = pathname === '/sign-in';
  const isPublicPage = pathname === '/' || pathname === '/forgot-password' || pathname === '/reset-password';
  
  // If on auth page and have token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If on public page, allow
  if (isPublicPage) {
    return NextResponse.next();
  }
  
  // For all other pages, require auth
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

// Match all page routes, exclude API and static
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).)*'],
};