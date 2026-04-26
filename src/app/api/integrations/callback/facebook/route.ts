import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/facebook';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=facebook_auth_failed', request.url));
  }
  
  try {
    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&client_secret=${FACEBOOK_CLIENT_SECRET}&code=${code}`;
    
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('Facebook token error:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=facebook_token_failed', request.url));
    }
    
    let accessToken = tokenData.access_token;
    const shortLivedToken = accessToken;
    
    // Get long-lived token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    
    if (longLivedData.access_token) {
      accessToken = longLivedData.access_token;
    }
    
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Get user's pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    
    // Use first page if available
    const pageId = pagesData.data?.[0]?.id || null;
    const pageName = pagesData.data?.[0]?.name || null;
    
    // Upsert integration
    await sqlRaw`
      INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, access_token_expires_at, page_id, page_name, status, created_at, updated_at)
      VALUES (${nanoid()}, ${state}, 'facebook', ${accessToken}, null, ${expiresAt}, ${pageId}, ${pageName}, 'connected', ${now}, ${now})
      ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = ${accessToken},
        access_token_expires_at = ${expiresAt},
        page_id = ${pageId},
        page_name = ${pageName},
        status = 'connected',
        updated_at = ${now}
    `;
    
    return NextResponse.redirect(new URL('/settings?success=facebook', request.url));
  } catch (error) {
    console.error('Facebook callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=facebook_error', request.url));
  }
}