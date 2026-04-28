import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/linkedin';

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/facebook';

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/canva';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  
  // Get integration status
  if (action === 'status') {
    const integrations = await sqlRaw`
      SELECT * FROM integrations WHERE user_id = ${userId}
    `;
    
    const result = {
      linkedin: integrations.find((i: any) => i.provider === 'linkedin') || null,
      facebook: integrations.find((i: any) => i.provider === 'facebook') || null,
      canva: integrations.find((i: any) => i.provider === 'canva') || null,
    };
    
    return NextResponse.json(result);
  }
  
  // Get OAuth URL for connecting
  if (action === 'connect') {
    const provider = searchParams.get('provider');
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider required' }, { status: 400 });
    }
    
    let authUrl = '';
    
    if (provider === 'linkedin') {
      const scopes = 'r_liteprofile r_emailaddress w_member_social';
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${userId}`;
    } else if (provider === 'facebook') {
      const scopes = 'pages_manage_posts,pages_read_engagement,public_profile';
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&scope=${scopes}&state=${userId}`;
    } else if (provider === 'canva') {
      // Canva OAuth 2.0 with PKCE - use minimal scopes
      const scopes = 'design:meta:read';
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Encode code_verifier in state (userId|codeVerifier)
      const state = `${userId}|${codeVerifier}`;
      
      // Build auth URL - ensure proper URL encoding
      const authUrlBase = `https://www.canva.com/api/oauth/authorize`;
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CANVA_CLIENT_ID!,
        redirect_uri: CANVA_REDIRECT_URI!,
        scope: scopes,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
      });
      
      const authUrl = `${authUrlBase}?${params.toString()}`;
      
      return NextResponse.json({ authUrl, provider: 'canva' });
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }
    
    return NextResponse.json({ authUrl });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const userId = (session.user as any)?.id;
  
  if (!provider) {
    return NextResponse.json({ error: 'Provider required' }, { status: 400 });
  }
  
  // Disconnect integration
  await sqlRaw`
    DELETE FROM integrations WHERE user_id = ${userId} AND provider = ${provider}
  `;
  
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { provider, code, pageId, pageName, companyId, companyName, canvaFolderId } = body;
  const userId = (session.user as any)?.id;
  const now = new Date().toISOString();
  
  if (!provider || !code) {
    return NextResponse.json({ error: 'Provider and code required' }, { status: 400 });
  }
  
  let accessToken = '';
  let refreshToken = '';
  let expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  // Exchange code for access token based on provider
  if (provider === 'linkedin') {
    const tokenUrl = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&client_id=${LINKEDIN_CLIENT_ID}&client_secret=${LINKEDIN_CLIENT_SECRET}`;
    
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    const tokenData = await tokenRes.json();
    
    if (tokenData.access_token) {
      accessToken = tokenData.access_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString();
    } else {
      return NextResponse.json({ error: 'Failed to get LinkedIn token', details: tokenData }, { status: 400 });
    }
  } else if (provider === 'facebook') {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=${FACEBOOK_CLIENT_SECRET}&code=${code}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    
    if (tokenData.access_token) {
      accessToken = tokenData.access_token;
      // Get long-lived token
      const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${accessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = await longLivedRes.json();
      if (longLivedData.access_token) {
        accessToken = longLivedData.access_token;
        expiresAt = new Date(Date.now() + (longLivedData.expires_in || 5184000) * 1000).toISOString();
      }
    } else {
      return NextResponse.json({ error: 'Failed to get Facebook token', details: tokenData }, { status: 400 });
    }
  } else if (provider === 'canva') {
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
    
    if (tokenData.access_token) {
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || '';
      expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
    } else {
      return NextResponse.json({ error: 'Failed to get Canva token', details: tokenData }, { status: 400 });
    }
  }
  
  // Upsert integration
  await sqlRaw`
    INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, access_token_expires_at, page_id, page_name, company_id, company_name, canva_folder_id, status, created_at, updated_at)
    VALUES (${nanoid()}, ${userId}, ${provider}, ${accessToken}, ${refreshToken}, ${expiresAt}, ${pageId || null}, ${pageName || null}, ${companyId || null}, ${companyName || null}, ${canvaFolderId || null}, 'connected', ${now}, ${now})
    ON CONFLICT (user_id, provider) DO UPDATE SET
      access_token = ${accessToken},
      refresh_token = ${refreshToken},
      access_token_expires_at = ${expiresAt},
      page_id = ${pageId || null},
      page_name = ${pageName || null},
      company_id = ${companyId || null},
      company_name = ${companyName || null},
canva_folder_id = ${canvaFolderId || null},
      status = 'connected',
      updated_at = ${now}
   `;
   
  return NextResponse.json({ success: true });
}

// PKCE Helper functions for Canva OAuth
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}