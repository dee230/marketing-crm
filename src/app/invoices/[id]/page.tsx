import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { sqlRaw } from '@/db';
import { canViewInvoices, canManageInvoices } from '@/lib/roles';
import type { InvoiceData } from '@/lib/invoice-pdf';
import { DownloadPDFButton } from './download-button';
import { StatusUpdateForm } from './status-update-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getInvoice(id: string) {
  const result = await sqlRaw`SELECT * FROM invoices WHERE id = ${id} LIMIT 1`;
  const invoice = result[0];
  if (!invoice) return null;
  
  const clientResult = await sqlRaw`SELECT * FROM clients WHERE id = ${invoice.client_id} LIMIT 1`;
  const client = clientResult[0];
  
  return { ...invoice, client };
}

async function updateInvoiceStatus(invoiceId: string, status: string, paidDate: string | null, paymentReference: string | null, userId: string) {
  'use server';
  
  const session = await getSession();
  if (!session) redirect('/sign-in');
  
  const userRole = (session.user as any)?.role;
  if (!canManageInvoices(userRole)) {
    throw new Error('Not authorized');
  }

  const now = new Date().toISOString();
  let query = `UPDATE invoices SET status = '${status}', updated_at = '${now}'`;
  
  // If marking as paid, set paidDate
  if (status === 'paid' && paidDate) {
    query += `, paid_date = '${new Date(paidDate).toISOString()}'`;
    if (paymentReference) {
      query += `, payment_reference = '${paymentReference}'`;
    }
  } else if (status !== 'paid') {
    query += `, paid_date = NULL, payment_reference = NULL`;
  }
  
  query += ` WHERE id = '${invoiceId}'`;
  
  await sqlRaw`${sqlRaw(query)}`;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const userId = (session.user as any)?.id;
  const userRole = (session.user as any)?.role;
  if (!canViewInvoices(userRole)) redirect('/dashboard');
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canManage = canManageInvoices(userRole);

  const invoiceData: InvoiceData = {
    invoiceNumber: (invoice as any).invoice_number || invoice.invoiceNumber,
    client: {
      name: invoice.client?.name || (invoice as any).client_name || 'N/A',
      company: (invoice as any).client?.company || (invoice as any).client_company,
      email: invoice.client?.email || (invoice as any).client_email,
      phone: invoice.client?.phone || (invoice as any).client_phone,
    },
    amount: invoice.amount,
    status: invoice.status,
    dueDate: (invoice as any).due_date || invoice.dueDate,
    paidDate: (invoice as any).paid_date || invoice.paidDate,
    description: invoice.description || (invoice as any).description,
    items: invoice.items ? JSON.parse(invoice.items as string) : null,
    notes: invoice.notes || (invoice as any).notes,
    createdAt: (invoice as any).created_at || invoice.createdAt,
  };

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/invoices" userRole={userRole} />
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
                <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Status</h3>
                <StatusUpdateForm 
                  invoiceId={invoice.id} 
                  currentStatus={invoice.status} 
                  canManage={canManage} 
                />
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