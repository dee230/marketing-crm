import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('=== DEBUG: Testing raw SQL ===');
    
    // Use raw SQL for select
    const tasksResult = await sqlRaw`SELECT * FROM tasks LIMIT 10`;
    console.log('Select result:', tasksResult);
    
    return NextResponse.json({
      success: true,
      message: 'Raw SQL debug completed',
      tasksCount: tasksResult.length,
      tasks: tasksResult,
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