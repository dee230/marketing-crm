import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// DISABLED - testing without proxy
// import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  // Allow all requests through for now
  return NextResponse.next();
}

// Match everything
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).)*'],
};