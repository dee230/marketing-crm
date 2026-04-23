import { NextResponse } from 'next/server';
import { db } from '@/db';
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
    const now = new Date();
    
    await db.insert(schema.tasks).values({
      id: taskId,
      title,
      description,
      assigneeId,
      clientId,
      status: status as any,
      priority: priority as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: now,
      updatedAt: now,
    });
    
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