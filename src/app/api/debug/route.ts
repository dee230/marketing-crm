import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection - try a simple select
    const result = await db.select().from(schema.users).limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection works!',
      userCount: result.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}

export async function POST() {
  console.log('=== DEBUG: Starting task insert test ===');
  
  try {
    // Check what db is
    console.log('db type:', typeof db);
    console.log('db keys:', Object.keys(db).slice(0, 10));
    console.log('db.insert type:', typeof db.insert);
    console.log('schema.tasks:', schema.tasks);
    
    // Try a simple select first
    console.log('=== Testing simple select ===');
    const tasksResult = await db.select().from(schema.tasks).limit(1);
    console.log('Select result count:', tasksResult.length);
    
    // Now try insert with the simplest possible values
    console.log('=== Testing minimal insert ===');
    const taskId = 'debug-test-' + Date.now();
    await db.insert(schema.tasks).values({
      id: taskId,
      title: 'Debug Test',
      status: 'pending',
      priority: 'medium',
    });
    console.log('Insert without .execute() worked');
    
    return NextResponse.json({
      success: true,
      message: 'Task insert test completed',
      taskId,
      tasksCount: tasksResult.length,
    });
  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorType: typeof error,
    }, { status: 500 });
  }
}