import { NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';

export async function POST(request: Request) {
  try {
    console.log('=== DEBUG: Starting task insert test ===');
    
    // Check what db is
    console.log('db type:', typeof db);
    console.log('db keys:', Object.keys(db).slice(0, 10));
    console.log('db.insert type:', typeof db.insert);
    
    // Try a simple select first
    console.log('=== Testing simple select ===');
    const tasksResult = await db.select().from(schema.tasks).limit(1);
    console.log('Select result count:', tasksResult.length);
    
    // Now try insert with the simplest possible values - no .returning()
    console.log('=== Testing minimal insert ===');
    const taskId = 'debug-test-' + Date.now();
    await db.insert(schema.tasks).values({
      id: taskId,
      title: 'Debug Test',
      status: 'pending',
      priority: 'medium',
    });
    
    console.log('Insert completed');
    
    return NextResponse.json({
      success: true,
      message: 'Debug completed',
      taskId,
    });
  } catch (error: any) {
    console.error('=== ERROR in debug ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}