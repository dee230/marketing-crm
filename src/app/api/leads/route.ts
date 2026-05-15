import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allLeads = await sqlRaw`
      SELECT l.*, c.name as client_name
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      ORDER BY l.created_at DESC
    `;
    return NextResponse.json({ leads: allLeads });
  } catch (error: any) {
    console.error('GET leads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
