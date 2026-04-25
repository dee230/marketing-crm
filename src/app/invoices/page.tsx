import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { sqlRaw } from '@/db';
import { canViewInvoices } from '@/lib/roles';
import { InvoicesFilters } from './invoices-filters';
import { InvoiceCalendar } from './invoice-calendar';

export const dynamic = 'force-dynamic';

async function markOverdueInvoices() {
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString();
  
  try {
    // Mark overdue invoices
    await sqlRaw`
      UPDATE invoices SET status = 'overdue', updated_at = ${now.toISOString()}
      WHERE status IN ('sent', 'draft')
      AND due_date < ${fiveDaysAgoStr}
    `;
  } catch (e) {
    console.error('Error marking overdue invoices:', e);
  }
}

async function getInvoices() {
  // Auto-mark overdue invoices
  await markOverdueInvoices();
  
  let invoices: any[] = [];
  try {
    invoices = await sqlRaw`
      SELECT i.*, c.name as client_name, c.company as client_company
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `;
  } catch (e) {
    console.error('Error fetching invoices:', e);
  }
  
  return invoices.map(invoice => ({
    ...invoice,
    client: invoice,
    clientName: invoice.client_name || null,
    invoiceNumber: invoice.invoice_number || null,
    dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
  }));
}

export default async function InvoicesPage() {
  const session = await getSession();
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