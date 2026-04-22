import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { canViewInvoices } from '@/lib/roles';
import { InvoicesFilters } from './invoices-filters';
import { InvoiceCalendar } from './invoice-calendar';

export const dynamic = 'force-dynamic';

async function markOverdueInvoices() {
  const allInvoices = await db.select().from(schema.invoices).execute();
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  
  for (const invoice of allInvoices) {
    // Only check invoices that are not paid, cancelled, or already overdue
    if (invoice.status !== 'sent' && invoice.status !== 'draft') continue;
    if (!invoice.dueDate) continue;
    
    const dueDate = new Date(invoice.dueDate);
    if (dueDate < fiveDaysAgo) {
      await db.update(schema.invoices)
        .set({ status: 'overdue', updatedAt: now })
        .where(eq(schema.invoices.id, invoice.id))
        .run();
    }
  }
}

async function getInvoices() {
  // Auto-mark overdue invoices
  await markOverdueInvoices();
  
  const invoices = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt)).execute();
  const clients = await db.select().from(schema.clients).execute();
  const clientMap = new Map(clients.map(c => [c.id, c]));
  
  return invoices.map(invoice => ({
    ...invoice,
    client: clientMap.get(invoice.clientId),
  }));
}

export default async function InvoicesPage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  if (!canViewInvoices(userRole)) redirect('/dashboard');

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const invoices = await getInvoices();

  // Separate invoices for calendar (only show non-paid)
  const calendarInvoices = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .map(inv => ({ ...inv, clientName: inv.client?.name || null }));

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Top Navigation */}
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/invoices" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Invoices</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Manage and track your invoices</p>
              </div>
              {isAdmin && (
                <Link href="/invoices/new" className="btn-primary">
                  + Create Invoice
                </Link>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No invoices yet</p>
                {isAdmin && (
                  <Link href="/invoices/new" style={{ color: '#E07A5F' }}>
                    Create your first invoice →
                  </Link>
                )}
              </div>
) : (
              <>
                <InvoiceCalendar invoices={calendarInvoices} />
                <InvoicesFilters invoices={invoices.map(inv => ({ ...inv, clientName: inv.client?.name || null }))} isAdmin={isAdmin} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}