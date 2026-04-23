import { NextResponse } from 'next/server';
import { db } from '@/db';
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
    const now = new Date();
    
    // Insert with only required fields - let defaults handle the rest
    const result = await db.insert(schema.tasks).values({
      id: taskId,
      title: title,
      status: (status || 'pending') as any,
      priority: (priority || 'medium') as any,
    }).execute();
    
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