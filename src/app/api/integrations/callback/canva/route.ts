import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/canva';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=canva_auth_failed', request.url));
  }
  
  try {
    // Exchange code for access token
    const tokenUrl = `https://www.canva.com/api/v1/oauth/token`;
    
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(CANVA_REDIRECT_URI)}`,
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('Canva token error:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=canva_token_failed', request.url));
    }
    
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Get user's folders
    const foldersUrl = 'https://api.canva.com/rest/v1/folders';
    const foldersRes = await fetch(foldersUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const foldersData = await foldersRes.json();
    
    const canvaFolderId = foldersData.items?.[0]?.id || null;
    
    // Upsert integration
    await sqlRaw`
      INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, access_token_expires_at, canva_folder_id, status, created_at, updated_at)
      VALUES (${nanoid()}, ${state}, 'canva', ${accessToken}, ${refreshToken}, ${expiresAt}, ${canvaFolderId}, 'connected', ${now}, ${now})
      ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = ${accessToken},
        refresh_token = ${refreshToken},
        access_token_expires_at = ${expiresAt},
        canva_folder_id = ${canvaFolderId},
        status = 'connected',
        updated_at = ${now}
    `;
    
    return NextResponse.redirect(new URL('/settings?success=canva', request.url));
  } catch (error) {
    console.error('Canva callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=canva_error', request.url));
  }
}