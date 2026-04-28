import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/canva';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state'); // userId|codeVerifier
  const error = searchParams.get('error');
  
  if (error) {
    console.error('Canva auth error:', error);
    return NextResponse.redirect(new URL(`/canva?error=canva_auth_failed&details=${error}`, request.url));
  }
  
  if (!code || !stateParam) {
    return NextResponse.redirect(new URL('/canva?error=canva_auth_failed', request.url));
  }
  
  // Parse state: userId|codeVerifier
  let userId = stateParam;
  let codeVerifier = '';
  if (stateParam.includes('|')) {
    const parts = stateParam.split('|');
    userId = parts[0];
    codeVerifier = parts[1];
  }
  
  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/canva?error=canva_missing_verifier', request.url));
  }
  
  try {
    // Exchange code for access token with PKCE
    const tokenUrl = 'https://api.canva.com/rest/v1/oauth/token';
    
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
        code: code,
        redirect_uri: CANVA_REDIRECT_URI,
      }),
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('Canva token error:', tokenData);
      return NextResponse.redirect(new URL(`/canva?error=canva_token_failed`, request.url));
    }
    
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || '';
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Get user's folder (to store as default folder)
    let canvaFolderId = null;
    try {
      const foldersUrl = 'https://api.canva.com/rest/v1/folders?parent_folder_id=root&limit=10';
      const foldersRes = await fetch(foldersUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const foldersData = await foldersRes.json();
      canvaFolderId = foldersData.items?.[0]?.id || null;
    } catch (e) {
      console.error('Canva folders error:', e);
    }
    
    // Upsert integration with PKCE tokens
    await sqlRaw`
      INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, access_token_expires_at, canva_folder_id, status, created_at, updated_at)
      VALUES (${nanoid()}, ${userId}, 'canva', ${accessToken}, ${refreshToken}, ${expiresAt}, ${canvaFolderId}, 'connected', ${now}, ${now})
      ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = ${accessToken},
        refresh_token = ${refreshToken},
        access_token_expires_at = ${expiresAt},
        canva_folder_id = ${canvaFolderId},
        status = 'connected',
        updated_at = ${now}
    `;
    
    return NextResponse.redirect(new URL('/canva?success=connected', request.url));
  } catch (error) {
    console.error('Canva callback error:', error);
    return NextResponse.redirect(new URL(`/canva?error=canva_error`, request.url));
  }
}