import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

export async function GET() {
  try {
    // Get all clients with their IDs and company names for debugging
    const clients = await sqlRaw`SELECT id, name, company, status FROM clients ORDER BY created_at DESC LIMIT 10`;
    return NextResponse.json({ clients });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}