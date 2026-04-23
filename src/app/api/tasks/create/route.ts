import { NextResponse } from 'next/server';
import { db } from '@/db';
import { logAudit } from '@/lib/audit-log';
import * as schema from '@/db/schema';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const assigneeId = formData.get('assigneeId') as string;
    const clientId = formData.get('clientId') as string;
    const priority = formData.get('priority') as string;
    const status = formData.get('status') as string;
    const dueDate = formData.get('dueDate') as string;
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const taskId = crypto.randomUUID();
    
    await db.insert(schema.tasks).values({
      id: taskId,
      title,
      description: description || null,
      assigneeId: assigneeId || null,
      clientId: clientId || null,
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).execute();
    
    return NextResponse.json({
      success: true,
      taskId,
      redirectUrl: '/tasks'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}