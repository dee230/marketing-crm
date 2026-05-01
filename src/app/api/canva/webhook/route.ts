import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  const body = await request.json();
  
  // This endpoint receives design data from Zapier webhook
  // Zapier watches Canva folder and sends new designs here
  const { designId, designName, designUrl, thumbnailUrl, exportUrl, createdAt } = body;
  
  // Store the design reference in our database
  const now = new Date().toISOString();
  
  // Option 1: Store in a canva_designs table (if we create one)
  // Option 2: Just acknowledge receipt
  
  console.log('Received design from Zapier:', { designId, designName });
  
  return NextResponse.json({ 
    success: true, 
    message: 'Design received',
    designId 
  });
}

// Also allow GET for testing
export async function GET(request: Request) {
  return NextResponse.json({ 
    message: 'Canva webhook endpoint ready',
    usage: 'POST design data from Zapier',
    fields: {
      designId: 'string',
      designName: 'string', 
      designUrl: 'string',
      thumbnailUrl: 'string',
      exportUrl: 'string'
    }
  });
}