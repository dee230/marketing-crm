import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { canViewInvoices } from '@/lib/roles';
import type { InvoiceData } from '@/lib/invoice-pdf';
import { DownloadPDFButton } from './download-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getInvoice(id: string) {
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).execute();
  if (!invoice) return null;
  
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, invoice.clientId)).execute();
  
  return { ...invoice, client };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const userRole = (session.user as any)?.role;
  if (!canViewInvoices(userRole)) redirect('/dashboard');
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    client: {
      name: invoice.client?.name || 'N/A',
      company: invoice.client?.company,
      email: invoice.client?.email,
      phone: invoice.client?.phone,
    },
    amount: invoice.amount,
    status: invoice.status,
    dueDate: invoice.dueDate,
    paidDate: invoice.paidDate,
    description: invoice.description,
    items: invoice.items ? JSON.parse(invoice.items) : null,
    notes: invoice.notes,
    createdAt: invoice.createdAt,
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <nav className="mt-6 px-4 space-y-1">
            <Link href="/dashboard" className="sidebar-link">Dashboard</Link>
            <Link href="/clients" className="sidebar-link">Clients</Link>
            <Link href="/leads" className="sidebar-link">Leads</Link>
            <Link href="/invoices" className="sidebar-link" style={{ background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' }}>Invoices</Link>
            <Link href="/accounting/pending" className="sidebar-link">Accounting</Link>
            <Link href="/tasks" className="sidebar-link">Tasks</Link>
            <Link href="/reports" className="sidebar-link">Reports</Link>
            <Link href="/users" className="sidebar-link">Users</Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Link href="/invoices" className="p-2 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{invoice.invoiceNumber}</h1>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Invoice Details</p>
                </div>
              </div>
              <DownloadPDFButton invoice={invoiceData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Client</h3>
                <p className="font-medium" style={{ color: '#2D2A26' }}>{invoice.client?.name || 'N/A'}</p>
                {invoice.client?.company && <p className="text-sm mt-1" style={{ color: '#9B9B8F' }}>{invoice.client.company}</p>}
                {invoice.client?.email && <p className="text-sm mt-1" style={{ color: '#9B9B8F' }}>{invoice.client.email}</p>}
                {invoice.client?.phone && <p className="text-sm mt-1" style={{ color: '#9B9B8F' }}>{invoice.client.phone}</p>}
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Invoice Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Status</span>
                    <span className={`badge ${invoice.status === 'paid' ? 'badge-completed' : invoice.status === 'sent' ? 'badge-sent' : invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'badge-pending'}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Issue Date</span>
                    <span className="text-sm" style={{ color: '#2D2A26' }}>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: '#9B9B8F' }}>Due Date</span>
                    <span className="text-sm" style={{ color: '#2D2A26' }}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span>
                  </div>
                  {invoice.paidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: '#9B9B8F' }}>Paid Date</span>
                      <span className="text-sm" style={{ color: '#2D2A26' }}>{new Date(invoice.paidDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(invoice as any).paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: '#9B9B8F' }}>Payment Ref</span>
                      <span className="text-sm font-medium" style={{ color: '#81B29A' }}>{(invoice as any).paymentReference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Amount</h3>
                <p className="text-3xl font-bold" style={{ color: '#E07A5F' }}>KES {invoice.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
                {invoice.description && <p className="text-sm mt-3" style={{ color: '#9B9B8F' }}>{invoice.description}</p>}
              </div>
            </div>

            {invoice.notes && (
              <div className="card p-6 mt-6">
                <h3 className="text-sm font-medium mb-2" style={{ color: '#9B9B8F' }}>Notes</h3>
                <p className="text-sm" style={{ color: '#2D2A26' }}>{invoice.notes}</p>
              </div>
            )}

            <div className="mt-6">
              <Link href="/invoices" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Invoices</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}