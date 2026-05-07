import { NextRequest, NextResponse } from 'next/server';
import { sqlRaw } from '@/db';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ designId: string }> }
) {
  const { designId } = await context.params;
  
  if (!designId) {
    return NextResponse.json({ error: 'Missing designId' }, { status: 400 });
  }
  
  try {
    // Get Canva integration (get the first connected one)
    const integrations = await sqlRaw`
      SELECT * FROM integrations 
      WHERE provider = 'canva' AND status = 'connected'
      LIMIT 1
    `;
    
    const integration = integrations[0];
    
    if (!integration) {
      return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
    }
    
    // Check if token needs refresh
    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.access_token_expires_at);
    
    if (expiresAt <= new Date()) {
      // Token expired, refresh it
      const refreshed = await refreshToken(integration.refresh_token, integration.user_id);
      if (!refreshed) {
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
      }
      accessToken = refreshed;
    }
    
    // Fetch designs from Canva API (list endpoint returns thumbnails)
    const designsRes = await fetch(`${CANVA_API_BASE}/designs?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!designsRes.ok) {
      const errorData = await designsRes.json();
      console.error('Canva designs fetch error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch designs', details: errorData }, { status: designsRes.status });
    }
    
    const designsData = await designsRes.json();
    console.log('Canva designs count:', designsData.items?.length);
    
    // Find the specific design by ID
    const design = designsData.items?.find((d: any) => d.id === designId);
    
    if (!design) {
      console.error('Design not found:', designId);
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }
    
    // Get thumbnail URL from design object
    const thumbnailUrl = design.thumbnail?.url;
    
    if (!thumbnailUrl) {
      console.error('No thumbnail in design:', design);
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
    }
    
    // Fetch the actual thumbnail image
    const imageRes = await fetch(thumbnailUrl);
    
    if (!imageRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch thumbnail image' }, { status: 502 });
    }
    
    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/png';
    
    // Return the image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=900', // Cache for 15 minutes
      },
    });
    
  } catch (error) {
    console.error('Thumbnail API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function refreshToken(refreshToken: string, userId: string): Promise<string | null> {
  const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
  const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
  
  try {
    const tokenUrl = 'https://api.canva.com/rest/v1/oauth/token';
    
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('Canva refresh error:', tokenData);
      return null;
    }
    
    // Update database with new tokens
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const now = new Date().toISOString();
    
    await sqlRaw`
      UPDATE integrations 
      SET access_token = ${tokenData.access_token}, 
          refresh_token = ${tokenData.refresh_token || refreshToken},
          access_token_expires_at = ${expiresAt},
          updated_at = ${now}
      WHERE user_id = ${userId} AND provider = 'canva'
    `;
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Canva refresh error:', error);
    return null;
  }
}
