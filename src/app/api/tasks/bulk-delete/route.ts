import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { inArray } from 'drizzle-orm';
import * as schema from '@/db/schema';

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user as any)?.role;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  
  const { ids } = await request.json();
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }
  
  // Delete the tasks
  await db.delete(schema.tasks).where(inArray(schema.tasks.id, ids)).execute();
  
  return NextResponse.json({ success: true, deletedCount: ids.length });
}