import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({ success: true });
    }

    // Check if there's already a pending request
    const existingRequest = await db.select()
      .from(schema.passwordResetRequests)
      .where(
        and(
          eq(schema.passwordResetRequests.userId, user.id),
          eq(schema.passwordResetRequests.status, 'pending')
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json({ 
        error: 'A reset request already exists. Please wait for admin approval or try again later.' 
      }, { status: 400 });
    }

    // Create reset request
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const [resetRequest] = await db.insert(schema.passwordResetRequests).values({
      id: nanoid(),
      userId: user.id,
      token,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt,
    }).returning();

    // Log the action
    await logAudit({
      userId: user.id,
      action: 'password_reset_requested',
      entityType: 'password_reset',
      entityId: resetRequest.id,
      details: { userEmail: email },
      ipAddress: ipAddress || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}