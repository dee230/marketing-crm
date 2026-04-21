import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit-log';

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  const body = await request.json();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  const id = nanoid();
  const now = new Date();
  
  await db.insert(clients).values({
    id,
    name: body.name,
    company: body.company || null,
    email: body.email || null,
    phone: body.phone || null,
    status: body.status || 'active',
    notes: null,
    createdAt: now,
    updatedAt: now,
  });
  
  // Log the action
  await logAudit({
    userId: session?.user?.id as string,
    action: 'client_created',
    entityType: 'client',
    entityId: id,
    details: { name: body.name, company: body.company },
    ipAddress: ipAddress || undefined,
  });
  
  return NextResponse.json({ success: true, id });
}