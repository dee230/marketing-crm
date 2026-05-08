import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  const user = session.user as any;
  const role = user?.role || 'member';
  
  return NextResponse.json({
    authenticated: true,
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    email: user.email,
    name: user.name,
  });
}
