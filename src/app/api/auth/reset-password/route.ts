import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Find the reset request by token
    const [resetRequest] = await db.select()
      .from(schema.passwordResetRequests)
      .where(eq(schema.passwordResetRequests.token, token))
      .limit(1);

    if (!resetRequest) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Check if already used
    if (resetRequest.status === 'used') {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 });
    }

    // Check if approved
    if (resetRequest.status !== 'approved') {
      return NextResponse.json({ error: 'Password reset not yet approved by admin' }, { status: 400 });
    }

    // Check if expired
    if (new Date() > new Date(resetRequest.expiresAt)) {
      return NextResponse.json({ error: 'Reset link has expired' }, { status: 400 });
    }

    // Update the user's password
    await db.update(schema.users)
      .set({ 
        password: password,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, resetRequest.userId))
      .run();

    // Mark the reset request as used
    await db.update(schema.passwordResetRequests)
      .set({
        status: 'used',
        usedAt: new Date(),
      })
      .where(eq(schema.passwordResetRequests.id, resetRequest.id))
      .run();

    // Log the action
    await logAudit({
      userId: resetRequest.userId,
      action: 'password_reset_used',
      entityType: 'password_reset',
      entityId: resetRequest.id,
      details: { userId: resetRequest.userId },
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}