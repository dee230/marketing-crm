import { NextResponse } from 'next/server';
import { db, sqlRaw } from '@/db';
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
  console.log('=== DEBUG: Testing raw SQL for tasks ===');
  
  try {
    // Use raw SQL for select
    const tasks = await sqlRaw`SELECT * FROM tasks LIMIT 5`;
    console.log('Tasks found:', tasks.length);
    
    return NextResponse.json({
      success: true,
      message: 'Raw SQL tasks query completed',
      tasksCount: tasks.length,
    });
  } catch (error: any) {
    console.error('=== ERROR ===');
    console.error('Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}