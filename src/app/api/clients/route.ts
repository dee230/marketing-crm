import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db, sqlRaw } from '@/db';
import { clients } from '@/db/schema';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit-log';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allClients = await sqlRaw`SELECT * FROM clients ORDER BY created_at DESC`;
    return NextResponse.json({ clients: allClients });
  } catch (error: any) {
    console.error('GET clients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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