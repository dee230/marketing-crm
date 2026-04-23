import Link from 'next/link';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

async function createClient(formData: FormData) {
  'use server';
  
  const session = await getSession();
  if (!session) redirect('/sign-in');
  
  const userId = (session.user as any)?.id;
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (!isAdmin) redirect('/dashboard');

  const name = formData.get('name') as string;
  const company = formData.get('company') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  const clientId = crypto.randomUUID();
  
  await db.insert(schema.clients).values({
    id: clientId,
    name,
    company: company || null,
    email: email || null,
    phone: phone || null,
    status: status as any,
    notes: notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).execute();

  // Log audit
  await logAudit({
    userId,
    action: 'client_created',
    entityType: 'client',
    entityId: clientId,
    details: { name, company, status },
  }).execute();

  redirect('/clients');
}

export default async function NewClientPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const isAdmin = (session.user as any)?.role === 'admin';
  if (!isAdmin) redirect('/dashboard');

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/clients" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Clients</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Add New Client</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <form action={createClient} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Company</label>
            <input
              type="text"
              id="company"
              name="company"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Phone</label>
            <input
              type="text"
              id="phone"
              name="phone"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Status</label>
            <select id="status" name="status">
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Add any notes about this client"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary">
              Create Client
            </button>
            <Link href="/clients" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}