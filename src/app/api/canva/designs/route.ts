import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const limit = searchParams.get('limit') || '25';
  const sortBy = searchParams.get('sort_by') || 'modified_descending';
  
  // Get Canva integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = 'canva' AND status = 'connected'
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
    const refreshed = await refreshToken(integration.refresh_token);
    if (!refreshed) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }
    accessToken = refreshed;
  }
  
  try {
    // Fetch designs from Canva
    const designsUrl = `${CANVA_API_BASE}/designs?limit=${limit}&sort_by=${sortBy}${query ? `&query=${encodeURIComponent(query)}` : ''}`;
    
    const designsRes = await fetch(designsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const designsData = await designsRes.json();
    
    if (!designsRes.ok) {
      console.error('Canva designs error:', designsData);
      return NextResponse.json({ error: 'Failed to fetch designs', details: designsData }, { status: designsRes.status });
    }
    
    return NextResponse.json(designsData);
  } catch (error) {
    console.error('Canva designs error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function refreshToken(refreshToken: string): Promise<string | null> {
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
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Canva refresh error:', error);
    return null;
  }
}