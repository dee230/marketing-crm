import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { logAudit } from '@/lib/audit-log';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  const { id } = await params;
  const body = await request.json();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
  const userId = (session?.user as any)?.id;
  const now = new Date().toISOString();
  
  // Build update query
  const updates: string[] = [];
  if (body.name !== undefined) updates.push(`name = '${body.name.replace(/'/g, "''")}'`);
  if (body.email !== undefined) updates.push(`email = ${body.email ? `'${body.email.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.phone !== undefined) updates.push(`phone = ${body.phone ? `'${body.phone.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.company !== undefined) updates.push(`company = ${body.company ? `'${body.company.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.status !== undefined) updates.push(`status = '${body.status}'`);
  if (body.notes !== undefined) updates.push(`notes = ${body.notes ? `'${body.notes.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.website !== undefined) updates.push(`website = ${body.website ? `'${body.website.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.linkedin !== undefined) updates.push(`linkedin = ${body.linkedin ? `'${body.linkedin.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.twitter !== undefined) updates.push(`twitter = ${body.twitter ? `'${body.twitter.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.instagram !== undefined) updates.push(`instagram = ${body.instagram ? `'${body.instagram.replace(/'/g, "''")}'` : 'NULL'}`);
  if (body.otherLinks !== undefined) updates.push(`other_links = ${body.otherLinks ? `'${body.otherLinks.replace(/'/g, "''")}'` : 'NULL'}`);
  
  updates.push(`updated_at = '${now}'`);
  
  if (updates.length > 1) {
    await sqlRaw`UPDATE clients SET ${sqlRaw(updates.join(', '))} WHERE id = ${id}`;
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
}