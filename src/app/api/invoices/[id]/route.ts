import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  const userId = (session.user as any)?.id;
  const now = new Date().toISOString();
  
  // Get current invoice using raw SQL
  const invoices = await sqlRaw`SELECT * FROM invoices WHERE id = ${id} LIMIT 1`;
  const currentInvoice = invoices[0];
  
  if (!currentInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  
  // Build update query
  const updates: string[] = [];
  
  if (body.status !== undefined) updates.push(`status = '${body.status}'`);
  if (body.description !== undefined) updates.push(`description = ${body.description ? `'${body.description.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.notes !== undefined) updates.push(`notes = ${body.notes ? `'${body.notes.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.amount !== undefined) updates.push(`amount = ${body.amount}`);
  
  // If marking as paid, set paidDate
  if (body.status === 'paid' && currentInvoice.status !== 'paid') {
    const paidDate = body.paidDate ? new Date(body.paidDate).toISOString() : now;
    updates.push(`paid_date = '${paidDate}'`);
    if (body.paymentReference) {
      updates.push(`payment_reference = '${body.paymentReference.replace(/'/g, "''")}'`);
    }
  }
  
  // If reverting from paid, clear paidDate
  if (body.status !== 'paid' && currentInvoice.status === 'paid') {
    updates.push(`paid_date = NULL`);
    updates.push(`payment_reference = NULL`);
  }
  
  updates.push(`updated_at = '${now}'`);
  
  await sqlRaw`UPDATE invoices SET ${sqlRaw(updates.join(', '))} WHERE id = ${id}`;
  
  // Log status changes
  if (body.status && body.status !== currentInvoice.status) {
    await logAudit({
      userId,
      action: 'invoice_status_changed',
      entityType: 'invoice',
      entityId: id,
      details: { oldStatus: currentInvoice.status, newStatus: body.status },
      ipAddress: ipAddress || undefined,
    });
  } else {
    await logAudit({
      userId,
      action: 'invoice_updated',
      entityType: 'invoice',
      entityId: id,
      details: { changes: Object.keys(body) },
      ipAddress: ipAddress || undefined,
    });
  }
  
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getSession();
  const userId = (session?.user as any)?.id;
  const { id } = await params;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  // Check if user is admin
  const userRole = (session?.user as any)?.role;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  await sqlRaw`DELETE FROM invoices WHERE id = ${id}`;
  
  // Log the action
  await logAudit({
    userId,
    action: 'invoice_deleted',
    entityType: 'invoice',
    entityId: id,
    ipAddress: ipAddress || undefined,
  });
  
  return NextResponse.json({ success: true });
}