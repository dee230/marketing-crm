import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  
  // Get current task to check status
  const [currentTask] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  
  if (!currentTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  
  // Get session to check if admin
  const session = await getServerSession(authConfig);
  const isAdmin = session && (session.user as any)?.role === 'admin';
  
  // Check if status is locked (was previously changed)
  const isStatusLocked = currentTask.statusLockedAt !== null;
  
  // If status is locked and user is not admin, prevent change
  if (isStatusLocked && !isAdmin) {
    return NextResponse.json({ 
      error: 'Status has been changed and can only be modified by admins',
      statusLockedAt: currentTask.statusLockedAt
    }, { status: 403 });
  }
  
  const updates: any = { ...body };
  updates.updatedAt = new Date();
  
  // If status is changing and wasn't previously locked, lock it
  if (body.status && body.status !== currentTask.status && !isStatusLocked) {
    updates.statusLockedAt = new Date();
    
    // If completing task, set completedAt
    if (body.status === 'completed') {
      updates.completedAt = new Date();
    }
  }
  
  // If admin is changing status on a locked task, allow it
  if (body.status && body.status !== currentTask.status && isStatusLocked && isAdmin) {
    if (body.status === 'completed') {
      updates.completedAt = new Date();
    }
  }
  
  await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).run();
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  
  // Only admins can delete tasks
  const session = await getServerSession(authConfig);
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 });
  }
  
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run();
  
  return NextResponse.json({ success: true });
}