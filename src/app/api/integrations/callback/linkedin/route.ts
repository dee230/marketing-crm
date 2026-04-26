import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/integrations/callback/linkedin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  
  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?error=linkedin_auth_failed', request.url));
  }
  
  try {
    // Exchange code for access token
    const tokenUrl = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&client_id=${LINKEDIN_CLIENT_ID}&client_secret=${LINKEDIN_CLIENT_SECRET}`;
    
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      console.error('LinkedIn token error:', tokenData);
      return NextResponse.redirect(new URL('/settings?error=linkedin_token_failed', request.url));
    }
    
    const accessToken = tokenData.access_token;
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString();
    const now = new Date().toISOString();
    
    // Get user profile to get company info
    const profileUrl = 'https://api.linkedin.com/v2/me';
    const profileRes = await fetch(profileUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    
    const companyId = profileData.id || null;
    const companyName = profileData.localizedName || profileData.name || null;
    
    // Upsert integration
    await sqlRaw`
      INSERT INTO integrations (id, user_id, provider, access_token, refresh_token, access_token_expires_at, company_id, company_name, status, created_at, updated_at)
      VALUES (${nanoid()}, ${state}, 'linkedin', ${accessToken}, null, ${expiresAt}, ${companyId}, ${companyName}, 'connected', ${now}, ${now})
      ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = ${accessToken},
        access_token_expires_at = ${expiresAt},
        company_id = ${companyId},
        company_name = ${companyName},
        status = 'connected',
        updated_at = ${now}
    `;
    
    return NextResponse.redirect(new URL('/settings?success=linkedin', request.url));
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=linkedin_error', request.url));
  }
}