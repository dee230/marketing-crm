import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function GET(request: Request) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all pending and overdue invoices
  const invoices = await sqlRaw`
    SELECT i.*, c.name as client_name, c.email as client_email, c.company as client_company, c.phone as client_phone
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.status IN ('sent', 'overdue')
    ORDER BY i.due_date DESC
  `;

  // Enrich invoices with client data
  const enrichedInvoices = invoices.map((invoice: any) => ({
    ...invoice,
    client: invoice.client_id ? {
      id: invoice.client_id,
      name: invoice.client_name,
      email: invoice.client_email,
      company: invoice.client_company,
      phone: invoice.client_phone,
    } : null,
  }));

  // Calculate summaries
  const totalPending = enrichedInvoices
    .filter((inv: any) => inv.status === 'sent')
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

  const totalOverdue = enrichedInvoices
    .filter((inv: any) => inv.status === 'overdue')
    .reduce((sum: number, inv: any) => sum + (Number(inv.amount) || 0), 0);

  return NextResponse.json({
    success: true,
    invoices: enrichedInvoices,
    summary: {
      pending: {
        count: enrichedInvoices.filter((inv: any) => inv.status === 'sent').length,
        total: totalPending,
      },
      overdue: {
        count: enrichedInvoices.filter((inv: any) => inv.status === 'overdue').length,
        total: totalOverdue,
      },
      totalOutstanding: totalPending + totalOverdue,
    },
  });
}