import { NextResponse } from 'next/server';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';

const API_SECRET = process.env.CANVA_WEBHOOK_SECRET;

// Allow POST without auth for Zapier webhooks
export async function POST(request: Request) {
  let body;
  try {
    const contentType = request.headers.get('content-type') || '';
    const rawText = await request.text();
    
    console.log('Raw webhook request:', rawText.slice(0, 500));
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      body = JSON.parse(rawText);
    } else {
      // Parse form-urlencoded or treat as raw JSON string
      try {
        body = JSON.parse(rawText);
      } catch {
        const params = new URLSearchParams(rawText);
        body = {};
        for (const [key, value] of params) {
          body[key] = value;
        }
      }
    }
  } catch (e) {
    console.log('Failed to parse body:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  console.log('Parsed body keys:', Object.keys(body));
  console.log('Parsed body:', JSON.stringify(body).slice(0, 500));
  
  // Accept various field name formats (including nested objects, arrays)
  const getField = (obj: any, ...keys: string[]): string | null => {
    if (!obj) return null;
    for (const key of keys) {
      let val = obj[key];
      if (val !== undefined && val !== null && val !== '') {
        // Handle JSON strings (Make.com might send JSON as string)
        if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
          try {
            val = JSON.parse(val);
          } catch {
            // Not valid JSON, keep as string
          }
        }
        // Handle nested objects (Canva might send {design: {id: ..., url: ...}})
        if (typeof val === 'object' && !Array.isArray(val)) {
          // Try common inner fields
          const inner = val.id || val.url || val.name || val.title || val.thumbnail || Object.values(val)[0];
          if (inner) return String(inner);
        }
        // Handle object with url field (like Image ID: {"url": "...", "width": 123})
        if (typeof val === 'object' && val.url) {
          return String(val.url);
        }
        return String(val).trim();
      }
    }
    return null;
  };
  
// Extract from root level
  let designId = getField(body, 'designId', 'design_id', 'id', 'DesignId', 'Design_ID', 'designId');
  let designName = getField(body, 'designName', 'design_name', 'title', 'name', 'DesignName', 'Design_Name', 'designName');
  let designUrl = getField(body, 'designUrl', 'design_url', 'url', 'link', 'DesignUrl', 'Design_url', 'view');
  let thumbnailUrl = getField(body, 'thumbnailUrl', 'thumbnail_url', 'thumbnail', 'thumb', 'Thumb', 'ThumbnailUrl');
  let exportUrl = getField(body, 'exportUrl', 'export_url', 'export', 'download', 'downloadUrl', 'ExportUrl');
  let userId = getField(body, 'userId', 'user_id', 'user', 'UserId', 'User_id');
  
  // Special handling for "Image ID" field (Make.com sends JSON string with url property)
  if (body['Image ID'] || body['Image_ID'] || body.image_id) {
    const imageField = body['Image ID'] || body['Image_ID'] || body.image_id;
    if (typeof imageField === 'string') {
      try {
        const imageData = JSON.parse(imageField);
        if (imageData?.url) {
          thumbnailUrl = imageData.url;
          console.log('Extracted thumbnail from Image ID:', imageData.url);
        }
      } catch {
        // If not JSON, use as-is
        if (imageField.startsWith('http')) {
          thumbnailUrl = imageField;
        }
      }
    } else if (typeof imageField === 'object' && imageField?.url) {
      thumbnailUrl = imageField.url;
    }
  }
  
  // Also check for nested 'design' object
  if (body?.design) {
    designId = designId || getField(body.design, 'id', 'designId', 'design_id');
    designName = designName || getField(body.design, 'name', 'title', 'designName');
    designUrl = designUrl || getField(body.design, 'url', 'link', 'view', 'href');
    thumbnailUrl = thumbnailUrl || getField(body.design, 'thumbnail', 'thumb');
    exportUrl = exportUrl || getField(body.design, 'export', 'download');
  }
  
  // Check for array of designs (Make.com might send bundle.data)
  if (body?.data && Array.isArray(body.data) && body.data[0]) {
    const firstDesign = body.data[0];
    designId = designId || getField(firstDesign, 'id', 'designId');
    designName = designName || getField(firstDesign, 'name', 'title');
    designUrl = designUrl || getField(firstDesign, 'url', 'view');
    thumbnailUrl = thumbnailUrl || getField(firstDesign, 'thumbnail');
    exportUrl = exportUrl || getField(firstDesign, 'export');
  }
  
  // Don't generate placeholder - only accept valid Canva IDs
  // (validation check above handles rejection)
  
  // Validate designId - must look like real Canva ID (e.g., "DAF_test_001", "DAHIJdW3RQQ")
  // Real Canva IDs: start with "DA" followed by letters/numbers, OR are valid alphanumeric (no placeholder patterns)
  const isPlaceholder = designId?.startsWith('canva-') || designId?.startsWith('test-') || /^[0-9]+$/.test(designId || '');
  const isValidCanvaId = designId && !isPlaceholder && designId.length >= 5;
  
  // If no valid Canva ID, skip storing
  if (!isValidCanvaId) {
    return NextResponse.json({ 
      skipped: true, 
      reason: 'Invalid design ID - must be real Canva ID (not placeholder or numeric)',
      designId 
    }, { status: 200 });
  }
  
  // Generate URLs from designId if missing 
  // Use Canva's embed/view URLs which work in browser when logged in
  if (!designUrl && designId && !designId.startsWith('canva-')) {
    designUrl = `https://www.canva.com/design/${designId}/edit`;
  }
  // Don't auto-generate thumbnail - it requires auth
  // Let the frontend show a placeholder instead
  if (!exportUrl && designId && !designId.startsWith('canva-')) {
    exportUrl = `https://www.canva.com/design/${designId}/download`;
  }
  
  console.log('Mapped fields:', { designId, designName, designUrl, thumbnailUrl, exportUrl });
  
  // Optional: verify API key if set
  
  const now = new Date().toISOString();
  
  try {
    // Store the design in canva_designs table
    await sqlRaw`
      INSERT INTO canva_designs (id, user_id, canva_design_id, title, design_url, thumbnail_url, export_url, status, created_at, updated_at)
      VALUES (${nanoid()}, ${userId || 'zapier-sync'}, ${designId}, ${designName || null}, ${designUrl || null}, ${thumbnailUrl || null}, ${exportUrl || null}, 'active', ${now}, ${now})
      ON CONFLICT (canva_design_id) DO UPDATE SET
        title = ${designName || null},
        design_url = ${designUrl || null},
        thumbnail_url = ${thumbnailUrl || null},
        export_url = ${exportUrl || null},
        updated_at = ${now}
    `;
    
    console.log('Stored design from Zapier:', { designId, designName });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Design stored',
      designId,
      received: { designName, designUrl, thumbnailUrl, exportUrl }
    });
  } catch (error) {
    console.error('Failed to store design:', error);
    return NextResponse.json({ error: 'Failed to store design' }, { status: 500 });
  }
}

// Get list of synced designs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const debug = searchParams.get('debug');
  
  // Debug: show integrations
  if (debug === 'integrations') {
    try {
      const integrations = await sqlRaw`SELECT id, user_id, provider, status, access_token_expires_at, created_at FROM integrations WHERE provider = 'canva'`;
      return NextResponse.json({ integrations });
    } catch (e) {
      return NextResponse.json({ error: e.message });
    }
  }
  
  try {
    const designs = await sqlRaw`
      SELECT * FROM canva_designs 
      WHERE status = 'active'
      ${userId ? sqlRaw`AND user_id = ${userId}` : sqlRaw``}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ designs });
  } catch (error) {
    console.error('Failed to fetch designs:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}

// Delete designs that start with "test-" or have valid IDs (cleanup)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const designId = searchParams.get('designId');
  
  try {
    let result;
    if (mode === 'archive' && designId) {
      // Archive a single design (removes from page, keeps Canva untouched)
      await sqlRaw`
        UPDATE canva_designs SET status = 'archived', updated_at = NOW() WHERE canva_design_id = ${designId}
      `;
      return NextResponse.json({ success: true, archived: designId });
    } else if (mode === 'test') {
      result = await sqlRaw`
        DELETE FROM canva_designs 
        WHERE canva_design_id LIKE 'test-%'
        RETURNING id
      `;
    } else if (mode === 'fix-urls') {
      // Update old URLs to correct format
      const designs = await sqlRaw`SELECT * FROM canva_designs`;
      let updated = 0;
      for (const d of designs) {
        if (d.canva_design_id && !d.canva_design_id.startsWith('canva-') && !d.canva_design_id.startsWith('test-')) {
          const newUrl = `https://www.canva.com/design/${d.canva_design_id}/edit`;
          const newThumb = `https://www.canva.com/design/${d.canva_design_id}/view?embed`;
          const newExport = `https://www.canva.com/design/${d.canva_design_id}/download`;
          await sqlRaw`
            UPDATE canva_designs 
            SET design_url = ${newUrl}, thumbnail_url = ${newThumb}, export_url = ${newExport}, updated_at = NOW()
            WHERE id = ${d.id}
          `;
          updated++;
        }
      }
      return NextResponse.json({ success: true, updated });
    } else {
      // Delete designs that have placeholder IDs (canva-timestamp)
      result = await sqlRaw`
        DELETE FROM canva_designs 
        WHERE canva_design_id LIKE 'canva-%'
        RETURNING id
      `;
    }
    
    return NextResponse.json({ success: true, deleted: result?.length || 0 });
  } catch (error) {
    console.error('Failed to delete designs:', error);
    return NextResponse.json({ error: 'Failed to delete designs' }, { status: 500 });
  }
}