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
  const { id } = await params;
  const body = await request.json();
  
  // Get current task
  const [currentTask] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).limit(1);
  
  if (!currentTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  
  // Get session
  const session = await getServerSession(authConfig);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  // Handle admin approving/rejecting a pending status change
  if (body.approvePending !== undefined && currentTask.pendingStatus) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can approve status changes' }, { status: 403 });
    }
    
    if (body.approvePending) {
      // Approve: Apply the pending status
      const updates: any = {
        status: currentTask.pendingStatus,
        pendingStatus: null,
        pendingStatusRequestedBy: null,
        pendingStatusRequestedAt: null,
        updatedAt: new Date(),
      };
      
      // If completing task, set completedAt
      if (currentTask.pendingStatus === 'completed') {
        updates.completedAt = new Date();
      }
      
      await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).execute();
      
      // Log audit
      await logAudit({
        userId,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: id,
        details: { 
          oldStatus: currentTask.status, 
          newStatus: currentTask.pendingStatus,
          approved: true
        },
      });
      
      return NextResponse.json({ success: true, message: 'Status change approved' });
    } else {
      // Reject: Clear pending status
      const updates = {
        pendingStatus: null,
        pendingStatusRequestedBy: null,
        pendingStatusRequestedAt: null,
        updatedAt: new Date(),
      };
      
      await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).execute();
      
      // Log audit
      await logAudit({
        userId,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: id,
        details: { 
          requestedStatus: currentTask.pendingStatus,
          approved: false
        },
      });
      
      return NextResponse.json({ success: true, message: 'Status change rejected' });
    }
  }
  
  // Regular status change logic
  const isStatusLocked = currentTask.statusLockedAt !== null;
  
  // If status is locked and user is not admin, prevent change (unless it's a pending request)
  if (isStatusLocked && !isAdmin) {
    return NextResponse.json({ 
      error: 'Status has been changed and can only be modified by admins',
      statusLockedAt: currentTask.statusLockedAt
    }, { status: 403 });
  }
  
  const newStatus = body.status;
  
  // If member (not admin) is changing status, set as pending
  if (!isAdmin && newStatus && newStatus !== currentTask.status) {
    const updates = {
      pendingStatus: newStatus,
      pendingStatusRequestedBy: userId,
      pendingStatusRequestedAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).execute();
    
    // Log audit
    await logAudit({
      userId,
      action: 'task_status_changed',
      entityType: 'task',
      entityId: id,
      details: { 
        oldStatus: currentTask.status, 
        newStatus: newStatus,
        pendingApproval: true
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Status change pending admin approval',
      pendingApproval: true 
    });
  }
  
  // Admin can change status directly
  const updates: any = { updatedAt: new Date() };
  
  if (newStatus && newStatus !== currentTask.status) {
    updates.status = newStatus;
    
    if (newStatus === 'completed') {
      updates.completedAt = new Date();
    }
  }
  
  await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).execute();
  
  // Log audit
  if (newStatus && newStatus !== currentTask.status) {
    await logAudit({
      userId,
      action: 'task_status_changed',
      entityType: 'task',
      entityId: id,
      details: { 
        oldStatus: currentTask.status, 
        newStatus: newStatus 
      },
    });
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  
  // Only admins can delete tasks
  const session = await getServerSession(authConfig);
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 });
  }
  
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id)).execute();
  
  return NextResponse.json({ success: true });
}
