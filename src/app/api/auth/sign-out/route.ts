import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

  // Log sign out if user is authenticated
  if (session?.user?.id) {
    await logAudit({
      userId: session.user.id as string,
      action: 'user_signed_out',
      entityType: 'user',
      entityId: session.user.id as string,
      ipAddress: ipAddress || undefined,
    });
  }

  // This route just returns success - actual sign out is handled client-side
  // because next-auth requires client-side sign out
  return NextResponse.json({ success: true });
}