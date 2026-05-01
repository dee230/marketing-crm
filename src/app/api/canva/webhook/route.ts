import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const API_SECRET = process.env.CANVA_WEBHOOK_SECRET;

// Allow POST without auth for Zapier webhooks
export async function POST(request: Request) {
  const body = await request.json();
  
  // Optional: verify API key if set
  const apiKey = request.headers.get('x-api-key');
  if (API_SECRET && apiKey !== API_SECRET) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }
  
  // Receive design data from Zapier webhook
  const { designId, designName, designUrl, thumbnailUrl, exportUrl, userId } = body;
  
  if (!designId) {
    return NextResponse.json({ error: 'designId required' }, { status: 400 });
  }
  
  const now = new Date().toISOString();
  
  try {
    // Store the design in canva_designs table
    await sqlRaw`
      INSERT INTO canva_designs (id, user_id, canva_design_id, title, design_url, thumbnail_url, export_url, status, created_at, updated_at)
      VALUES (${nanoid()}, ${userId || 'zapier-sync'}, ${designId}, ${designName || null}, ${designUrl || null}, ${thumbnailUrl || null}, ${exportUrl || null}, 'active', ${now}, ${now})
      ON CONFLICT (canva_design_id) DO UPDATE SET
        title = ${designName || null},
        design_url = ${designUrl || null},
        thumbnail_url = ${thumbnailUrl || null},
        export_url = ${exportUrl || null},
        updated_at = ${now}
    `;
    
    console.log('Stored design from Zapier:', { designId, designName });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Design stored',
      designId 
    });
  } catch (error) {
    console.error('Failed to store design:', error);
    return NextResponse.json({ error: 'Failed to store design' }, { status: 500 });
  }
}

// Get list of synced designs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  try {
    const designs = await sqlRaw`
      SELECT * FROM canva_designs 
      WHERE status = 'active'
      ${userId ? sqlRaw`AND user_id = ${userId}` : sqlRaw``}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ designs });
  } catch (error) {
    console.error('Failed to fetch designs:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}