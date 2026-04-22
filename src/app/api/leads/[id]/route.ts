import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '@/db/schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  
  // Get current lead to check for status change
  const [currentLead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  
  if (!currentLead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  
  const updates: any = { ...body };
  updates.updatedAt = new Date();
  
  // Check if status is changing from qualified to converted
  const isQualifiedToConverted = 
    currentLead.status === 'qualified' && 
    body.status === 'converted';
  
  if (isQualifiedToConverted) {
    // Set convertedAt timestamp
    updates.convertedAt = new Date();
    
    // Create a new client from the lead's data
    const clientId = nanoid();
    const now = new Date();
    
    await db.insert(schema.clients).values({
      id: clientId,
      name: currentLead.name || '',
      company: currentLead.company || '',
      email: currentLead.email || '',
      phone: currentLead.phone || '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).execute();
    
    // Link this lead to the new client
    updates.clientId = clientId;
  }
  
  await db.update(schema.leads).set(updates).where(eq(schema.leads.id, id)).execute();
  
  return NextResponse.json({ success: true, convertedToClient: isQualifiedToConverted });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user as any)?.role;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
  }
  
  const { id } = await params;
  
  // Check if lead exists
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
  
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }
  
  // Delete the lead
  await db.delete(schema.leads).where(eq(schema.leads.id, id)).execute();
  
  return NextResponse.json({ success: true });
}