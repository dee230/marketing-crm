import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'No user ID' }, { status: 400 });
  }

  // Get Canva integration
  const integrations = await sqlRaw`
    SELECT * FROM integrations WHERE user_id = ${userId} AND provider = 'canva' AND status = 'connected' LIMIT 1
  `;

  const integration = integrations[0];
  if (!integration) {
    return NextResponse.json({ error: 'Canva not connected' }, { status: 400 });
  }

  // Refresh token if needed
  let accessToken = integration.access_token;
  const expiresAt = new Date(integration.access_token_expires_at);
  if (expiresAt <= new Date()) {
    const refreshed = await refreshToken(integration.refresh_token, userId);
    if (!refreshed) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }
    accessToken = refreshed;
  }

  try {
    // Fetch ALL designs from Canva API
    const designsRes = await fetch(`${CANVA_API_BASE}/designs?limit=200`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!designsRes.ok) {
      const errorData = await designsRes.json();
      console.error('Canva API error during sync:', errorData);
      return NextResponse.json({ error: 'Failed to fetch designs from Canva' }, { status: designsRes.status });
    }

    const designsData = await designsRes.json();
    const canvaItems: any[] = designsData.items || [];
    console.log(`Sync: fetched ${canvaItems.length} designs from Canva API`);

    // Get current active DB designs
    const dbDesigns = await sqlRaw`
      SELECT id, canva_design_id FROM canva_designs WHERE status = 'active'
    `;
    const dbIds = new Set(dbDesigns.map((d: any) => d.canva_design_id));
    const canvaIds = new Set(canvaItems.map((d: any) => d.id));
    const now = new Date().toISOString();

    // 1. Import new designs from Canva that aren't in our DB
    let imported = 0;
    for (const item of canvaItems) {
      if (!dbIds.has(item.id)) {
        const designUrl = `https://www.canva.com/design/${item.id}/edit`;
        const thumbnailUrl = item.thumbnail?.url || null;

        await sqlRaw`
          INSERT INTO canva_designs (id, user_id, canva_design_id, title, design_url, thumbnail_url, status, created_at, updated_at)
          VALUES (${nanoid()}, ${userId}, ${item.id}, ${item.title || 'Untitled'}, ${designUrl}, ${thumbnailUrl}, 'active', ${now}, ${now})
          ON CONFLICT (canva_design_id) DO UPDATE SET
            title = ${item.title || 'Untitled'},
            design_url = ${designUrl},
            thumbnail_url = ${thumbnailUrl},
            updated_at = ${now}
        `;
        imported++;
      }
    }

    // 2. Archive DB designs that no longer exist in Canva
    let archived = 0;
    for (const dbDesign of dbDesigns) {
      if (dbDesign.canva_design_id && !canvaIds.has(dbDesign.canva_design_id)) {
        await sqlRaw`
          UPDATE canva_designs SET status = 'archived', updated_at = ${now} WHERE id = ${dbDesign.id}
        `;
        archived++;
      }
    }

    console.log(`Sync: imported ${imported} new, archived ${archived} deleted`);

    // 3. Return the updated active designs
    const designs = await sqlRaw`
      SELECT * FROM canva_designs WHERE status = 'active' ORDER BY created_at DESC LIMIT 50
    `;

    return NextResponse.json({
      success: true,
      designs,
      stats: { imported, archived, total: designs.length },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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
