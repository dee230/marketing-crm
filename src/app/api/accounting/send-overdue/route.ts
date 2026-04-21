import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createOverdueEmail, sendEmail, isEmailConfigured } from '@/components/accounting/email-templates';
import { nanoid } from 'nanoid';

// In-memory follow-up tracking (in production, use database)
const emailFollowUps = new Map<string, {
  id: string;
  invoiceId: string;
  type: 'reminder' | 'overdue';
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}>();

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const session = await getServerSession(authConfig);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const isAdmin = (session.user as any)?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const { forceResend = false } = body;

  // Get invoice with client data
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(eq(schema.invoices.id, id))
    .limit(1);

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Get client data
  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, invoice.clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (!client.email) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });
  }

  // Calculate days overdue
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  // Check if invoice is actually overdue (must be 5+ days past due date)
  if (daysOverdue < 5) {
    return NextResponse.json({ 
      error: `Invoice is not yet overdue enough to send notice. ${5 - daysOverdue} more days required.`,
      daysOverdue,
      requiredDays: 5,
    }, { status: 400 });
  }

  // Check if invoice is in valid state
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    return NextResponse.json({ 
      error: `Cannot send overdue notice for invoice with status: ${invoice.status}` 
    }, { status: 400 });
  }

  // Check if overdue notice was already sent recently (within 7 days)
  if (!forceResend) {
    const lastOverdue = emailFollowUps.get(`overdue-${id}`);
    if (lastOverdue) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (lastOverdue.sentAt > sevenDaysAgo) {
        return NextResponse.json({ 
          error: 'Overdue notice already sent recently. Use forceResend to bypass.' 
        }, { status: 400 });
      }
    }
  }

  // Check email configuration
  if (!isEmailConfigured()) {
    // Log the notice as "simulated" for demo purposes
    const overdueId = nanoid();
    emailFollowUps.set(`overdue-${id}`, {
      id: overdueId,
      invoiceId: id,
      type: 'overdue',
      sentAt: new Date(),
      status: 'sent',
    });

    // Update invoice status to overdue if not already
    if (invoice.status !== 'overdue') {
      await db
        .update(schema.invoices)
        .set({ status: 'overdue', updatedAt: new Date() })
        .where(eq(schema.invoices.id, id))
        .run();
    }

    // Store in notes
    const currentNotes = invoice.notes || '';
    const overdueLog = `\n[${new Date().toISOString()}] Overdue notice email sent (simulated - email service not configured)`;
    
    await db
      .update(schema.invoices)
      .set({ notes: currentNotes + overdueLog, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .run();

    return NextResponse.json({ 
      success: true, 
      message: 'Overdue notice logged (simulated - email service not configured)',
      overdueId,
      simulated: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        clientEmail: client.email,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        daysOverdue,
      },
      statusUpdated: invoice.status !== 'overdue',
      emailConfig: {
        configured: false,
        message: 'Configure SMTP, Resend, or SendGrid in environment variables to enable email sending',
      },
    });
  }

  // Create email content
  const emailData = {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
    dueDate: invoice.dueDate,
    clientName: client.name,
    clientEmail: client.email,
    company: client.company || undefined,
    description: invoice.description || undefined,
  };

  const emailContent = createOverdueEmail(emailData);

  // Send email
  const result = await sendEmail(client.email, emailContent);

  const overdueId = nanoid();

  if (result.success) {
    // Log successful overdue notice
    emailFollowUps.set(`overdue-${id}`, {
      id: overdueId,
      invoiceId: id,
      type: 'overdue',
      sentAt: new Date(),
      status: 'sent',
    });

    // Update invoice status to overdue if not already
    let statusUpdated = false;
    if (invoice.status !== 'overdue') {
      await db
        .update(schema.invoices)
        .set({ status: 'overdue', updatedAt: new Date() })
        .where(eq(schema.invoices.id, id))
        .run();
      statusUpdated = true;
    }

    // Update invoice notes
    const currentNotes = invoice.notes || '';
    const overdueLog = `\n[${new Date().toISOString()}] Overdue notice email sent (ID: ${overdueId})`;
    
    await db
      .update(schema.invoices)
      .set({ notes: currentNotes + overdueLog, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .run();

    return NextResponse.json({
      success: true,
      message: 'Overdue notice sent successfully',
      overdueId,
      messageId: result.messageId,
      daysOverdue,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        clientEmail: client.email,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        daysOverdue,
      },
      statusUpdated,
    });
  } else {
    // Log failed overdue notice
    emailFollowUps.set(`overdue-${id}`, {
      id: overdueId,
      invoiceId: id,
      type: 'overdue',
      sentAt: new Date(),
      status: 'failed',
      error: result.error,
    });

    return NextResponse.json({
      success: false,
      error: result.error,
      overdueId,
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  // Get overdue notices history for this invoice
  const overdueNotices = Array.from(emailFollowUps.values())
    .filter(entry => entry.invoiceId === id && entry.type === 'overdue')
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

  return NextResponse.json({
    invoiceId: id,
    overdueNotices,
    emailConfigured: isEmailConfigured(),
  });
}
