import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';

export async function POST(request: Request) {
  console.log('API called: /api/tasks/create');
  
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
    
    const now = new Date();
    const taskId = crypto.randomUUID();
    
    console.log('Inserting task with all fields explicitly:', { taskId, title, priority, status });
    
    await db.insert(schema.tasks).values({
      id: taskId,
      title,
      description: description || null,
      assigneeId: assigneeId || null,
      clientId: clientId || null,
      status: (status || 'pending') as any,
      priority: (priority || 'medium') as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      completedAt: null,
      statusLockedAt: null,
      pendingStatus: null,
      pendingStatusRequestedBy: null,
      pendingStatusRequestedAt: null,
      createdAt: now,
      updatedAt: now,
    }).execute();
    
    console.log('Task created successfully');
    
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