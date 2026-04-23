import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export async function POST() {
  try {
    console.log('Running migration: Adding pending status columns...');
    
    // Add pending status columns one at a time, using separate queries for Neon compatibility
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pending_status TEXT`;
    } catch (e) { console.log('pending_status may already exist'); }
    
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pending_status_requested_by TEXT`;
    } catch (e) { console.log('pending_status_requested_by may already exist'); }
    
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pending_status_requested_at TIMESTAMP WITH TIME ZONE`;
    } catch (e) { console.log('pending_status_requested_at may already exist'); }
    
    try {
      await sqlRaw`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_locked_at TIMESTAMP WITH TIME ZONE`;
    } catch (e) { console.log('status_locked_at may already exist'); }
    
    console.log('Migration complete!');
    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}