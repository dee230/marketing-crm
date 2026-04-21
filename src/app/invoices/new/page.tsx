import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { TopNav } from '@/components/top-nav';

export const dynamic = 'force-dynamic';

async function createInvoice(formData: FormData) {
  'use server';
  
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');
  
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (!isAdmin) redirect('/dashboard');

  const clientId = formData.get('clientId') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const description = formData.get('description') as string;
  const dueDate = formData.get('dueDate') as string;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  // Generate invoice number
  const invoiceCount = await db.select({ count: schema.invoices.id }).from(schema.invoices);
  const invoiceNumber = `INV-${String(invoiceCount[0]?.count || 0 + 1).padStart(4, '0')}`;

  await db.insert(schema.invoices).values({
    id: crypto.randomUUID(),
    invoiceNumber,
    clientId,
    amount,
    description: description || null,
    dueDate: new Date(dueDate),
    status: status as any,
    notes: notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  redirect('/invoices');
}

export default async function NewInvoicePage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  if (!isAdmin) redirect('/dashboard');

  const clients = await db.select().from(schema.clients).where(eq(schema.clients.status, 'active')).all();

  return (
    <div className="animate-fade-in">
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />
      <div className="mb-6">
        <Link href="/invoices" className="text-sm" style={{ color: '#9B9B8F' }}>← Back to Invoices</Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2D2A26' }}>Create Invoice</h1>
      </div>
      
      <div className="card p-8 max-w-2xl">
        <form action={createInvoice} className="space-y-5">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Client *</label>
            <select id="clientId" name="clientId" required>
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name} - {client.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Amount (KES) *</label>
            <input type="number" id="amount" name="amount" step="0.01" min="0" required placeholder="0.00" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Description</label>
            <textarea id="description" name="description" rows={3} placeholder="Enter invoice description" />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Due Date *</label>
            <input type="date" id="dueDate" name="dueDate" required />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Status</label>
            <select id="status" name="status">
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: '#3D405B' }}>Notes</label>
            <textarea id="notes" name="notes" rows={2} placeholder="Add any notes" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary">
              Create Invoice
            </button>
            <Link href="/invoices" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}