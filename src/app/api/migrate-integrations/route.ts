import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export async function POST() {
  try {
    // Create integrations table
    await sqlRaw`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        access_token_expires_at TIMESTAMP WITH TIME ZONE,
        page_id TEXT,
        page_name TEXT,
        company_id TEXT,
        company_name TEXT,
        canva_folder_id TEXT,
        status TEXT NOT NULL DEFAULT 'disconnected',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(user_id, provider)
      )
    `;
    
    return NextResponse.json({ success: true, message: 'Integrations table created' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Run migration
  return POST();
}