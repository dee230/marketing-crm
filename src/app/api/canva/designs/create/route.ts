import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  const body = await request.json();
  const { title, designType } = body;
  
  // Get Canva integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = 'canva' AND status = 'connected'
  `;
  
  const integration = integrations[0];
  
  if (!integration) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }
  
  let accessToken = integration.access_token;
  
  // Check if token needs refresh
  const expiresAt = new Date(integration.access_token_expires_at);
  if (expiresAt <= new Date()) {
    const refreshed = await refreshToken(integration.refresh_token);
    if (!refreshed) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }
    accessToken = refreshed;
  }
  
  try {
    // Create a new design
    const createDesignUrl = `${CANVA_API_BASE}/designs`;
    
    const designData: any = {
      type: 'type_and_asset',
      design_type: {
        type: 'preset',
        name: designType || 'poster',
      },
    };
    
    if (title) {
      designData.title = title;
    }
    
    const createRes = await fetch(createDesignUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(designData),
    });
    
    const createResult = await createRes.json();
    console.log('Canva create design:', JSON.stringify(createResult));
    
    if (!createRes.ok) {
      console.error('Canva create design error:', createResult);
      return NextResponse.json({ error: 'Failed to create design', details: createResult }, { status: createRes.status });
    }
    
    return NextResponse.json(createResult);
  } catch (error) {
    console.error('Canva create design error:', error);
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
      return null;
    }
    
    return tokenData.access_token;
  } catch {
    return null;
  }
}