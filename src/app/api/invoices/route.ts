import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allInvoices = await sqlRaw`
      SELECT i.*, c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `;
    return NextResponse.json({ invoices: allInvoices });
  } catch (error: any) {
    console.error('GET invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
