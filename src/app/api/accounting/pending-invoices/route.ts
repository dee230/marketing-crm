import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq, and, gte, lte, or, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authConfig);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all pending and overdue invoices
  const invoices = await db
    .select()
    .from(schema.invoices)
    .where(
      or(
        eq(schema.invoices.status, 'sent'),
        eq(schema.invoices.status, 'overdue')
      )
    )
    .orderBy(desc(schema.invoices.dueDate))
    .execute();

  // Get all clients
  const allClients = await db.select().from(schema.clients).execute();
  const clientMap = new Map(allClients.map(c => [c.id, c]));

  // Enrich invoices with client data
  const enrichedInvoices = invoices.map(invoice => {
    const client = clientMap.get(invoice.clientId);
    return {
      ...invoice,
      client: client ? {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        phone: client.phone,
      } : null,
    };
  });

  // Calculate summaries
  const totalPending = enrichedInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOverdue = enrichedInvoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return NextResponse.json({
    success: true,
    invoices: enrichedInvoices,
    summary: {
      pending: {
        count: enrichedInvoices.filter(inv => inv.status === 'sent').length,
        total: totalPending,
      },
      overdue: {
        count: enrichedInvoices.filter(inv => inv.status === 'overdue').length,
        total: totalOverdue,
      },
      totalOutstanding: totalPending + totalOverdue,
    },
  });
}
