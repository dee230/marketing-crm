import { NextResponse } from 'next/server';
import { db, sqlRaw } from '@/db';
import * as schema from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || null;
    const assigneeId = formData.get('assigneeId') as string || null;
    const clientId = formData.get('clientId') as string || null;
    const priority = formData.get('priority') as string || 'medium';
    const status = formData.get('status') as string || 'pending';
    const dueDate = formData.get('dueDate') as string || null;
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Use raw SQL for insert with proper timestamp handling
    await sqlRaw`
      INSERT INTO tasks (id, title, description, assignee_id, client_id, status, priority, due_date, created_at, updated_at)
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
        ${now}
      )
    `;
    
    return NextResponse.json({
      success: true,
      taskId,
      redirectUrl: '/tasks'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}