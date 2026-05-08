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
    // STEP 1: Check if we have a stored thumbnail_url in our database (from webhook sync)
    const storedDesigns = await sqlRaw`
      SELECT thumbnail_url FROM canva_designs 
      WHERE canva_design_id = ${designId} AND thumbnail_url IS NOT NULL
      LIMIT 1
    `;
    
    if (storedDesigns.length > 0 && storedDesigns[0].thumbnail_url) {
      const storedThumbnail = storedDesigns[0].thumbnail_url;
      console.log('Serving cached thumbnail for:', designId);
      
      // Try to fetch and proxy the stored thumbnail URL
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const imageRes = await fetch(storedThumbnail, { signal: controller.signal });
        clearTimeout(timeout);
        if (imageRes.ok) {
          const imageBuffer = await imageRes.arrayBuffer();
          const contentType = imageRes.headers.get('content-type') || 'image/png';
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=900',
            },
          });
        }
      } catch (e) {
        console.log('Cached thumbnail fetch failed, trying Canva API:', e.message);
      }
    }
    
    // STEP 2: Fall back to Canva API (needs integration)
    const integrations = await sqlRaw`
      SELECT * FROM integrations 
      WHERE provider = 'canva' AND status = 'connected'
      LIMIT 1
    `;
    
    const integration = integrations[0];
    
    if (!integration) {
      // No integration — return empty (UI will show placeholder)
      return new NextResponse(null, { status: 204 });
    }
    
    // Check if token needs refresh
    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.access_token_expires_at);
    
    if (expiresAt <= new Date()) {
      const refreshed = await refreshToken(integration.refresh_token, integration.user_id);
      if (!refreshed) {
        // Can't refresh — return empty (UI will show placeholder)
        console.warn('Thumbnail: token refresh failed, showing placeholder');
        return new NextResponse(null, { status: 204 });
      }
      accessToken = refreshed;
    }
    
    // Fetch designs from Canva API
    const designsRes = await fetch(`${CANVA_API_BASE}/designs?limit=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!designsRes.ok) {
      const errorData = await designsRes.json();
      console.error('Canva designs fetch error:', errorData);
      // Return empty — UI will show placeholder
      return new NextResponse(null, { status: 204 });
    }
    
    const designsData = await designsRes.json();
    console.log('Canva designs count:', designsData.items?.length);
    
    const design = designsData.items?.find((d: any) => d.id === designId);
    
    if (!design) {
      console.error('Design not found in Canva API:', designId);
      // Return empty — UI will show placeholder
      return new NextResponse(null, { status: 204 });
    }
    
    const thumbnailUrl = design.thumbnail?.url;
    
    if (!thumbnailUrl) {
      console.error('No thumbnail in design:', design);
      return new NextResponse(null, { status: 204 });
    }
    
    const imageRes = await fetch(thumbnailUrl);
    
    if (!imageRes.ok) {
      return new NextResponse(null, { status: 204 });
    }
    
    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/png';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=900',
      },
    });
    
  } catch (error) {
    console.error('Thumbnail API error:', error);
    return new NextResponse(null, { status: 204 });
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
