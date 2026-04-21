import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createReminderEmail, sendEmail, isEmailConfigured } from '@/components/accounting/email-templates';
import { nanoid } from 'nanoid';

// Follow-up tracking for reminders (in-memory for demo, use database in production)
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

  // Check if invoice is in a valid state for reminder
  if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
    return NextResponse.json({ 
      error: `Cannot send reminder for invoice with status: ${invoice.status}` 
    }, { status: 400 });
  }

  // Check if reminder was already sent recently (within 3 days)
  if (!forceResend) {
    const lastReminder = emailFollowUps.get(`reminder-${id}`);
    if (lastReminder) {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      if (lastReminder.sentAt > threeDaysAgo) {
        return NextResponse.json({ 
          error: 'Reminder already sent recently. Use forceResend to bypass.' 
        }, { status: 400 });
      }
    }
  }

  // Check email configuration
  if (!isEmailConfigured()) {
    // Log the reminder as "simulated" for demo purposes
    const reminderId = nanoid();
    emailFollowUps.set(`reminder-${id}`, {
      id: reminderId,
      invoiceId: id,
      type: 'reminder',
      sentAt: new Date(),
      status: 'sent',
    });

    // Store reminder in notes field (in production, you'd want a separate table)
    const currentNotes = invoice.notes || '';
    const reminderLog = `\n[${new Date().toISOString()}] Payment reminder email sent (simulated - email service not configured)`;
    
    await db
      .update(schema.invoices)
      .set({ notes: currentNotes + reminderLog, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .run();

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder logged (simulated - email service not configured)',
      reminderId,
      simulated: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        clientEmail: client.email,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
      },
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

  const emailContent = createReminderEmail(emailData);

  // Send email
  const result = await sendEmail(client.email, emailContent);

  const reminderId = nanoid();

  if (result.success) {
    // Log successful reminder
    emailFollowUps.set(`reminder-${id}`, {
      id: reminderId,
      invoiceId: id,
      type: 'reminder',
      sentAt: new Date(),
      status: 'sent',
    });

    // Update invoice notes
    const currentNotes = invoice.notes || '';
    const reminderLog = `\n[${new Date().toISOString()}] Payment reminder email sent (ID: ${reminderId})`;
    
    await db
      .update(schema.invoices)
      .set({ notes: currentNotes + reminderLog, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .run();

    return NextResponse.json({
      success: true,
      message: 'Payment reminder sent successfully',
      reminderId,
      messageId: result.messageId,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: client.name,
        clientEmail: client.email,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
      },
    });
  } else {
    // Log failed reminder
    emailFollowUps.set(`reminder-${id}`, {
      id: reminderId,
      invoiceId: id,
      type: 'reminder',
      sentAt: new Date(),
      status: 'failed',
      error: result.error,
    });

    return NextResponse.json({
      success: false,
      error: result.error,
      reminderId,
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  // Get invoice reminders history
  const reminders = Array.from(emailFollowUps.values())
    .filter(entry => entry.invoiceId === id && entry.type === 'reminder')
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());

  return NextResponse.json({
    invoiceId: id,
    reminders,
    emailConfigured: isEmailConfigured(),
  });
}
