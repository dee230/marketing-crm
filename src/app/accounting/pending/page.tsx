import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { getInvoices } from './get-pending-invoices';
import { formatKES } from '@/lib/currency';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function PendingPaymentsPage(props: PageProps) {
  const params = await props.searchParams;
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }
  
  const userRole = session.user.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  if (!isAdmin) {
    redirect('/dashboard');
  }
  
  const invoices = await getInvoices();
  
  // Filter based on query param
  const filter = params.filter || 'all';
  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'pending') return inv.status === 'sent';
    if (filter === 'overdue') return inv.status === 'overdue';
    return inv.status === 'sent' || inv.status === 'overdue';
  });
  
  const totalPending = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
    
  const totalOverdue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email} isAdmin={isAdmin} />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/accounting/pending" userRole={userRole} />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>Pending Payments</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Track and follow up on outstanding invoices</p>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                    <svg className="w-6 h-6" style={{ color: '#B8923D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Pending</p>
                    <p className="text-xl font-bold" style={{ color: '#B8923D' }}>{formatKES(totalPending)}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                    <svg className="w-6 h-6" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Overdue</p>
                    <p className="text-xl font-bold" style={{ color: '#E07A5F' }}>{formatKES(totalOverdue)}</p>
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                    <svg className="w-6 h-6" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Outstanding</p>
                    <p className="text-xl font-bold" style={{ color: '#3D405B' }}>{formatKES(totalPending + totalOverdue)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 mb-6">
              <Link
                href="/accounting/pending"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'all' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                All ({invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length})
              </Link>
              <Link
                href="/accounting/pending?filter=pending"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'pending' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'pending' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                Pending ({invoices.filter(i => i.status === 'sent').length})
              </Link>
              <Link
                href="/accounting/pending?filter=overdue"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'overdue' 
                    ? 'btn-primary' 
                    : 'bg-white border'
                }`}
                style={filter !== 'overdue' ? { borderColor: '#E8E4DD', color: '#2D2A26' } : {}}
              >
                Overdue ({invoices.filter(i => i.status === 'overdue').length})
              </Link>
            </div>
            
            {/* Invoices Table */}
            {filteredInvoices.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                  <svg className="w-8 h-8" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="mb-4" style={{ color: '#9B9B8F' }}>No pending payments</p>
                <Link href="/invoices" style={{ color: '#E07A5F' }}>
                  Go to Invoices →
                </Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Client</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(invoice => {
                      const dueDate = new Date(invoice.due_date);
                      const now = new Date();
                      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntilDue < 0;
                      
                      return (
                        <tr key={invoice.id}>
                          <td>
                            <Link 
                              href={`/invoices/${invoice.id}`}
                              className="font-medium hover:underline"
                              style={{ color: '#2D2A26' }}
                            >
                              {invoice.invoice_number}
                            </Link>
                            {invoice.description && (
                              <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                                {invoice.description.substring(0, 50)}
                                {invoice.description.length > 50 ? '...' : ''}
                              </p>
                            )}
                          </td>
                          <td>
                            <div className="font-medium" style={{ color: '#2D2A26' }}>
                              {invoice.client?.name || 'Unknown'}
                            </div>
                            {invoice.client?.email && (
                              <div className="text-xs" style={{ color: '#9B9B8F' }}>
                                {invoice.client.email}
                              </div>
                            )}
                          </td>
                          <td className="font-semibold" style={{ color: '#E07A5F' }}>
                            {formatKES(Number(invoice.amount))}
                          </td>
                          <td>
                            <div style={{ color: '#2D2A26' }}>
                              {dueDate.toLocaleDateString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-xs" style={{ 
                              color: isOverdue ? '#E07A5F' : '#9B9B8F',
                              fontWeight: isOverdue ? 600 : 400
                            }}>
                              {isOverdue 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : `${daysUntilDue} days until due`
                              }
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'overdue' 
                                ? 'badge-overdue' 
                                : 'badge-sent'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Link 
                                href={`/invoices/${invoice.id}`}
                                className="btn-outline text-sm py-1.5 px-3"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Info Box */}
            <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(61, 64, 91, 0.08)' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#3D405B' }}>Email Service Not Configured</p>
                  <p className="text-xs mt-1" style={{ color: '#9B9B8F' }}>
                    To enable email reminders, configure SMTP, Resend, or SendGrid in your environment variables. 
                    Currently, reminders are logged in the invoice notes for demonstration purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}