import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allTasks = await sqlRaw`
      SELECT t.*, 
        u.name as assignee_name, 
        c.name as client_name,
        creator.name as created_by_name,
        updater.name as updated_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users updater ON t.updated_by = updater.id
      ORDER BY t.created_at DESC
    `;
    return NextResponse.json({ tasks: allTasks });
  } catch (error: any) {
    console.error('GET tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
