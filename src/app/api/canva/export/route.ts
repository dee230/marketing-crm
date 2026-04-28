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
  const { designId, format, quality, size, width, height, pages } = body;
  
  if (!designId || !format) {
    return NextResponse.json({ error: 'designId and format required' }, { status: 400 });
  }
  
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
    // Build export format object
    const formatObj: any = { type: format };
    
    if (format === 'pdf') {
      if (quality) formatObj.export_quality = quality;
      if (size) formatObj.size = size;
      if (pages) formatObj.pages = pages;
    } else if (format === 'jpg') {
      if (quality) formatObj.quality = quality;
      if (width) formatObj.width = width;
      if (height) formatObj.height = height;
      if (pages) formatObj.pages = pages;
    } else if (format === 'png') {
      if (width) formatObj.width = width;
      if (height) formatObj.height = height;
      if (pages) formatObj.pages = pages;
    }
    
    // Create export job
    const exportUrl = `${CANVA_API_BASE}/exports`;
    
    const exportRes = await fetch(exportUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design_id: designId,
        format: formatObj,
      }),
    });
    
    const exportData = await exportRes.json();
    
    if (!exportRes.ok) {
      console.error('Canva export error:', exportData);
      return NextResponse.json({ error: 'Failed to create export', details: exportData }, { status: exportRes.status });
    }
    
    // Return the export job - client can poll for completion
    return NextResponse.json({
      exportId: exportData.job?.id || exportData.id,
      status: exportData.job?.status || exportData.status,
      message: 'Export job created. Poll for completion.',
    });
  } catch (error) {
    console.error('Canva export error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Also handle GET to check export status
export async function GET(request: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any)?.id;
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get('exportId');
  
  if (!exportId) {
    return NextResponse.json({ error: 'exportId required' }, { status: 400 });
  }
  
  // Get Canva integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = 'canva' AND status = 'connected'
  `;
  
  const integration = integrations[0];
  
  if (!integration) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }
  
  try {
    // Check export status
    const statusUrl = `${CANVA_API_BASE}/exports/${exportId}`;
    
    const statusRes = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
      },
    });
    
    const statusData = await statusRes.json();
    
    if (!statusRes.ok) {
      return NextResponse.json({ error: 'Failed to get export status', details: statusData }, { status: statusRes.status });
    }
    
    return NextResponse.json(statusData);
  } catch (error) {
    console.error('Canva export status error:', error);
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