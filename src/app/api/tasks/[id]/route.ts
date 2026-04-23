import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  
  // Get current task using raw SQL
  const currentTasks = await sqlRaw`SELECT * FROM tasks WHERE id = ${id} LIMIT 1`;
  const currentTask = currentTasks[0];
  
  if (!currentTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  
  // Get session
  const session = await getSession();
  
  // Check if user is logged in
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 });
  }
  
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;
  
  // Check if user has valid role
  if (!userRole) {
    return NextResponse.json({ error: 'Invalid session. Please log in again.' }, { status: 401 });
  }
  
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const now = new Date().toISOString();
  
  // Handle admin approving/rejecting a pending status change
  if (body.approvePending !== undefined && currentTask.pending_status) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can approve status changes' }, { status: 403 });
    }
    
    if (body.approvePending) {
      // Approve: Apply the pending status
      let completedAt = 'NULL';
      if (currentTask.pending_status === 'completed') {
        completedAt = `'${now}'`;
      }
      
      await sqlRaw`
        UPDATE tasks SET 
          status = ${currentTask.pending_status},
          pending_status = NULL,
          pending_status_requested_by = NULL,
          pending_status_requested_at = NULL,
          completed_at = ${currentTask.pending_status === 'completed' ? now : null},
          updated_at = ${now}
        WHERE id = ${id}
      `;
      
      // Log audit
      await logAudit({
        userId,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: id,
        details: { 
          oldStatus: currentTask.status, 
          newStatus: currentTask.pending_status,
          approved: true
        },
      });
      
      return NextResponse.json({ success: true, message: 'Status change approved' });
    } else {
      // Reject: Clear pending status
      await sqlRaw`
        UPDATE tasks SET 
          pending_status = NULL,
          pending_status_requested_by = NULL,
          pending_status_requested_at = NULL,
          updated_at = ${now}
        WHERE id = ${id}
      `;
      
      // Log audit
      await logAudit({
        userId,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: id,
        details: { 
          requestedStatus: currentTask.pending_status,
          approved: false
        },
      });
      
      return NextResponse.json({ success: true, message: 'Status change rejected' });
    }
  }
  
  // Regular status change logic
  const isStatusLocked = currentTask.status_locked_at !== null;
  
  // If status is locked and user is not admin, prevent change (unless it's a pending request)
  if (isStatusLocked && !isAdmin) {
    return NextResponse.json({ 
      error: 'Status has been changed and can only be modified by admins',
      statusLockedAt: currentTask.status_locked_at
    }, { status: 403 });
  }
  
  const newStatus = body.status;
  
  // If member (not admin) is changing status, set as pending
  if (!isAdmin && newStatus && newStatus !== currentTask.status) {
    await sqlRaw`
      UPDATE tasks SET 
        pending_status = ${newStatus},
        pending_status_requested_by = ${userId},
        pending_status_requested_at = ${now},
        updated_at = ${now}
      WHERE id = ${id}
    `;
    
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
  let completedAt = 'NULL';
  if (newStatus === 'completed' && newStatus !== currentTask.status) {
    completedAt = `'${now}'`;
  }
  
  if (newStatus && newStatus !== currentTask.status) {
    await sqlRaw`
      UPDATE tasks SET 
        status = ${newStatus},
        completed_at = ${newStatus === 'completed' ? now : null},
        updated_at = ${now}
      WHERE id = ${id}
    `;
    
    // Log audit
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
  } else {
    await sqlRaw`UPDATE tasks SET updated_at = ${now} WHERE id = ${id}`;
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  
  // Only admins can delete tasks
  const session = await getSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 });
  }
  
  await sqlRaw`DELETE FROM tasks WHERE id = ${id}`;
  
  return NextResponse.json({ success: true });
}