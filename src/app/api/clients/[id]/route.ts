import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authConfig);
  const { id } = await params;
  const body = await request.json();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  const updates: any = { ...body };
  updates.updatedAt = new Date();
  
  await db.update(schema.clients).set(updates).where(eq(schema.clients.id, id)).execute();
  
  // Log the action
  await logAudit({
    userId: session?.user?.id as string,
    action: 'client_updated',
    entityType: 'client',
    entityId: id,
    details: { changes: Object.keys(body) },
    ipAddress: ipAddress || undefined,
  });
  
  return NextResponse.json({ success: true });
}