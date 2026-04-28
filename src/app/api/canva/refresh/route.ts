import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  
  // Get Canva integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = 'canva'
  `;
  
  const integration = integrations[0];
  
  if (!integration) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }
  
  const refreshToken = integration.refresh_token;
  
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 400 });
  }
  
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
      return NextResponse.json({ error: 'Failed to refresh token', details: tokenData }, { status: 400 });
    }
    
    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token || refreshToken;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Update the integration with new tokens
    await sqlRaw`
      UPDATE integrations 
      SET access_token = ${newAccessToken},
          refresh_token = ${newRefreshToken},
          access_token_expires_at = ${expiresAt},
          updated_at = ${now}
      WHERE user_id = ${userId} AND provider = 'canva'
    `;
    
    return NextResponse.json({
      success: true,
      expiresAt,
    });
  } catch (error) {
    console.error('Canva refresh error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}