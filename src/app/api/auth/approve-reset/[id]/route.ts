import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { canViewUsers } from '@/lib/roles';
import { logAudit } from '@/lib/audit-log';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user as any)?.role;
  if (!canViewUsers(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  // Get the reset request
  const [resetRequest] = await db.select()
    .from(schema.passwordResetRequests)
    .where(eq(schema.passwordResetRequests.id, id))
    .limit(1);

  if (!resetRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (resetRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
  }

  const adminId = session.user?.id as string;

  // Approve the request
  await db.update(schema.passwordResetRequests)
    .set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminId,
    })
    .where(eq(schema.passwordResetRequests.id, id))
    .execute();

  // Log the action
  await logAudit({
    userId: adminId,
    action: 'password_reset_approved',
    entityType: 'password_reset',
    entityId: id,
    details: { targetUserId: resetRequest.userId },
    ipAddress: ipAddress || undefined,
  });

  return NextResponse.json({ success: true });
}