import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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
    
    // Use direct Neon query function
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql(
      `INSERT INTO tasks (id, title, description, assignee_id, client_id, status, priority, due_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [taskId, title, description, assigneeId, clientId, status, priority, dueDate, now, now]
    );
    
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
    
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Use direct SQL with all columns explicitly
    const sql = process.env.DATABASE_URL!;
    const db = neon(sql);
    
    const result = await db.execute(
      `INSERT INTO tasks (id, title, description, assignee_id, client_id, status, priority, due_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [taskId, title, description, assigneeId, clientId, status, priority, dueDate || null, now, now]
    );
    
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