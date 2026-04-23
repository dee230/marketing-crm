import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export async function POST() {
  try {
    console.log('Running migration: Adding pending status columns...');
    
    // Add pending status columns if they don't exist
    await sqlRaw`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS pending_status TEXT,
      ADD COLUMN IF NOT EXISTS pending_status_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS pending_status_requested_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS status_locked_at TIMESTAMP WITH TIME ZONE
    `;
    
    console.log('Migration complete!');
    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}