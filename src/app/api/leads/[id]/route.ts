import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const session = await getSession();
  const userId = (session?.user as any)?.id;
  
  // Get current lead to check for status change
  const leads = await sqlRaw`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
  const currentLead = leads[0];
  
  if (!currentLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  
  const now = new Date().toISOString();
  
  // Check if status is changing from qualified to converted
  const isQualifiedToConverted = 
    currentLead.status === 'qualified' && 
    body.status === 'converted';
  
  if (isQualifiedToConverted) {
    // Create a new client from the lead's data
    const clientId = nanoid();
    
    await sqlRaw`
      INSERT INTO clients (id, name, company, email, phone, status, created_at, updated_at)
      VALUES (${clientId}, ${currentLead.name || ''}, ${currentLead.company || ''}, ${currentLead.email || ''}, ${currentLead.phone || ''}, 'active', ${now}, ${now})
    `;
    
    // Update lead with client_id and status
    await sqlRaw`
      UPDATE leads SET 
        status = 'converted',
        client_id = ${clientId},
        converted_at = ${now},
        updated_at = ${now}
      WHERE id = ${id}
    `;
    
    // Log audit
    await logAudit({
      userId,
      action: 'lead_status_changed',
      entityType: 'lead',
      entityId: id,
      details: { 
        oldStatus: currentLead.status, 
        newStatus: 'converted',
        convertedToClient: true,
        clientId 
      },
    });
    
    return NextResponse.json({ success: true, convertedToClient: true, clientId });
  }
  
  // Regular update - use individual field updates
  if (body.name !== undefined) {
    await sqlRaw`UPDATE leads SET name = ${body.name}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.email !== undefined) {
    await sqlRaw`UPDATE leads SET email = ${body.email || null}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.phone !== undefined) {
    await sqlRaw`UPDATE leads SET phone = ${body.phone || null}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.company !== undefined) {
    await sqlRaw`UPDATE leads SET company = ${body.company || null}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.source !== undefined) {
    await sqlRaw`UPDATE leads SET source = ${body.source}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.status !== undefined) {
    await sqlRaw`UPDATE leads SET status = ${body.status}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.notes !== undefined) {
    await sqlRaw`UPDATE leads SET notes = ${body.notes || null}, updated_at = ${now} WHERE id = ${id}`;
  }
  if (body.client_id !== undefined) {
    await sqlRaw`UPDATE leads SET client_id = ${body.client_id || null}, updated_at = ${now} WHERE id = ${id}`;
  }
  
  // Log audit
  await logAudit({
    userId,
    action: 'lead_updated',
    entityType: 'lead',
    entityId: id,
    details: { changes: Object.keys(body) },
  });
  
  return NextResponse.json({ success: true, convertedToClient: false });
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
  
  // Check if lead exists
  const leads = await sqlRaw`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
  
  if (!leads[0]) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  
  // Delete the lead
  await sqlRaw`DELETE FROM leads WHERE id = ${id}`;
  
  // Log audit
  const userId = (session?.user as any)?.id;
  await logAudit({
    userId,
    action: 'lead_deleted',
    entityType: 'lead',
    entityId: id,
    details: {},
  });
  
  return NextResponse.json({ success: true });
}