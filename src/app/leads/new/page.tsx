import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sqlRaw } from '@/db';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

async function createLead(formData: FormData) {
  'use server';
  
  const session = await getSession();
  if (!session) redirect('/sign-in');
  
  const userId = (session.user as any)?.id;
  const userRole = (session.user as any)?.role;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const company = formData.get('company') as string;
  const source = formData.get('source') as string;
  const status = formData.get('status') as string;
  const clientId = formData.get('clientId') as string;
  const notes = formData.get('notes') as string;

  const leadId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await sqlRaw`
    INSERT INTO leads (id, name, email, phone, company, source, status, client_id, notes, created_at, updated_at)
    VALUES (${leadId}, ${name}, ${email || null}, ${phone || null}, ${company || null}, ${source}, ${status}, ${clientId || null}, ${notes || null}, ${now}, ${now})
  `;

  // Log audit
  await logAudit({
    userId,
    action: 'lead_created',
    entityType: 'lead',
    entityId: leadId,
    details: { name, source, status },
  });

  redirect('/leads');
}

export default async function NewLeadPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const clients = await sqlRaw`SELECT id, name, company FROM clients WHERE status = 'active' ORDER BY name`;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link href="/leads" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Leads</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Add New Lead</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <form action={createLead} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Name *</label>
            <input type="text" id="name" name="name" required placeholder="Enter lead name" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Email</label>
            <input type="email" id="email" name="email" placeholder="Enter email address" />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Phone</label>
            <input type="text" id="phone" name="phone" placeholder="Enter phone number" />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Company</label>
            <input type="text" id="company" name="company" placeholder="Enter company name" />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Source</label>
            <select id="source" name="source">
              <option value="other">Other</option>
              <option value="linkedin">LinkedIn</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="cold-call">Cold Call</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Status</label>
            <select id="status" name="status">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Associated Client</label>
            <select id="clientId" name="clientId">
              <option value="">None</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} - {client.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="Add any notes about this lead" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary">
              Create Lead
            </button>
            <Link href="/leads" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}