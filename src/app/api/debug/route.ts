import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test database connection - try a simple select
    const result = await db.select().from(users).limit(1);
    
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