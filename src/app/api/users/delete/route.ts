import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { isSuperAdmin } from '@/lib/roles';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  if (!isSuperAdmin(userRole)) {
    return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 });
  }

  try {
    const { userId } = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === session.user?.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await db.delete(schema.users).where(eq(schema.users.id, userId)).run();
    
    // Log the action
    await logAudit({
      userId: session.user?.id as string,
      action: 'user_deleted',
      entityType: 'user',
      entityId: userId,
      details: { deletedBy: session.user?.id },
      ipAddress: ipAddress || undefined,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}