import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    const { id } = await params;
    const body = await request.json();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const userId = (session?.user as any)?.id;
    const now = new Date().toISOString();
    
    // Build update query using tagged template
    if (body.name !== undefined) {
      await sqlRaw`UPDATE clients SET name = ${body.name}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.email !== undefined) {
      await sqlRaw`UPDATE clients SET email = ${body.email || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.phone !== undefined) {
      await sqlRaw`UPDATE clients SET phone = ${body.phone || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.company !== undefined) {
      await sqlRaw`UPDATE clients SET company = ${body.company || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.status !== undefined) {
      await sqlRaw`UPDATE clients SET status = ${body.status}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.notes !== undefined) {
      await sqlRaw`UPDATE clients SET notes = ${body.notes || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.website !== undefined) {
      await sqlRaw`UPDATE clients SET website = ${body.website || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.linkedin !== undefined) {
      await sqlRaw`UPDATE clients SET linkedin = ${body.linkedin || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.twitter !== undefined) {
      await sqlRaw`UPDATE clients SET twitter = ${body.twitter || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.instagram !== undefined) {
      await sqlRaw`UPDATE clients SET instagram = ${body.instagram || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    if (body.otherLinks !== undefined) {
      await sqlRaw`UPDATE clients SET other_links = ${body.otherLinks || null}, updated_at = ${now} WHERE id = ${id}`;
    }
    
    // Log the action
    await logAudit({
      userId,
      action: 'client_updated',
      entityType: 'client',
      entityId: id,
      details: { changes: Object.keys(body) },
      ipAddress: ipAddress || undefined,
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH client error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session?.user as any)?.role;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  
  const { id } = await params;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  const userId = (session?.user as any)?.id;
  
  // Check if client exists
  const clients = await sqlRaw`SELECT * FROM clients WHERE id = ${id} LIMIT 1`;
  
  if (!clients[0]) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  
  // Delete the client
  await sqlRaw`DELETE FROM clients WHERE id = ${id}`;
  
  // Log audit
  await logAudit({
    userId,
    action: 'client_deleted',
    entityType: 'client',
    entityId: id,
    details: { name: clients[0].name, company: clients[0].company },
    ipAddress: ipAddress || undefined,
  });
  
  return NextResponse.json({ success: true });
}