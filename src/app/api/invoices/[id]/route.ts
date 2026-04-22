import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAudit } from '@/lib/audit-log';
import { canManageInvoices } from '@/lib/roles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authConfig);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any)?.role;
  if (!canManageInvoices(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  // Get current invoice
  const [currentInvoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1);
  
  if (!currentInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  
  const updates: any = { ...body };
  updates.updatedAt = new Date();
  
  // If marking as paid, set paidDate
  if (body.status === 'paid' && currentInvoice.status !== 'paid') {
    updates.paidDate = body.paidDate ? new Date(body.paidDate) : new Date();
    if (body.paymentReference) {
      updates.paymentReference = body.paymentReference;
    }
  }
  
  // If reverting from paid, clear paidDate
  if (body.status !== 'paid' && currentInvoice.status === 'paid') {
    updates.paidDate = null;
    updates.paymentReference = null;
  }

  await db.update(schema.invoices).set(updates).where(eq(schema.invoices.id, id)).execute();
  
  // Log status changes
  if (body.status && body.status !== currentInvoice.status) {
    await logAudit({
      userId: session.user.id as string,
      action: 'invoice_status_changed',
      entityType: 'invoice',
      entityId: id,
      details: { oldStatus: currentInvoice.status, newStatus: body.status },
      ipAddress: ipAddress || undefined,
    });
  } else {
    await logAudit({
      userId: session.user.id as string,
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
  const session = await getServerSession(authConfig);
  const { id } = await params;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  
  await db.delete(schema.invoices).where(eq(schema.invoices.id, id)).execute();
  
  // Log the action
  await logAudit({
    userId: session?.user?.id as string,
    action: 'invoice_deleted',
    entityType: 'invoice',
    entityId: id,
    ipAddress: ipAddress || undefined,
  });
  
  return NextResponse.json({ success: true });
}