import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

const API_SECRET = process.env.CANVA_WEBHOOK_SECRET;

// Allow POST without auth for Zapier webhooks
export async function POST(request: Request) {
  const body = await request.json();
  
  // Optional: verify API key if set
  const apiKey = request.headers.get('x-api-key');
  if (API_SECRET && apiKey !== API_SECRET) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  
  // This endpoint receives design data from Zapier webhook
  // Zapier watches Canva folder and sends new designs here
  const { designId, designName, designUrl, thumbnailUrl, exportUrl, createdAt } = body;
  
  console.log('Received design from Zapier:', { designId, designName });
  
  return NextResponse.json({ 
    success: true, 
    message: 'Design received',
    designId 
  });
}