import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body - accept both JSON and formData
    let title: string | null = null;
    let description: string | null = null;
    let assigneeId: string | null = null;
    let clientId: string | null = null;
    let priority = 'medium';
    let status = 'pending';
    let dueDate: string | null = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      title = body.title;
      description = body.description || null;
      assigneeId = body.assigneeId || null;
      clientId = body.clientId || null;
      priority = body.priority || 'medium';
      status = body.status || 'pending';
      dueDate = body.dueDate || null;
    } else {
      const formData = await request.formData();
      title = formData.get('title') as string;
      description = formData.get('description') as string || null;
      assigneeId = formData.get('assigneeId') as string || null;
      clientId = formData.get('clientId') as string || null;
      priority = formData.get('priority') as string || 'medium';
      status = formData.get('status') as string || 'pending';
      dueDate = formData.get('dueDate') as string || null;
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Use raw SQL for insert with proper timestamp handling
    const userId = (session.user as any)?.id || null;

    await sqlRaw`
      INSERT INTO tasks (id, title, description, assignee_id, client_id, status, priority, due_date, created_at, updated_at, created_by, updated_by)
      VALUES (
        ${taskId},
        ${title},
        ${description},
        ${assigneeId},
        ${clientId},
        ${status},
        ${priority},
        ${dueDate ? new Date(dueDate).toISOString() : null},
        ${now},
        ${now},
        ${userId},
        ${userId}
      )
    `;

    return NextResponse.json({
      success: true,
      taskId,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
