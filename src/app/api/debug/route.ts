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
  console.log('=== DEBUG: Adding created_by and updated_by columns ===');
  
  try {
    // Add created_by column
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL`;
      console.log('Added created_by column');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('created_by already exists');
      } else {
        throw e;
      }
    }
    
    // Add updated_by column  
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL`;
      console.log('Added updated_by column');
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('updated_by already exists');
      } else {
        throw e;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed - created_by and updated_by columns added',
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