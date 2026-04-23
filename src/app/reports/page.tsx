import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { TopNav } from '@/components/top-nav';
import { SidebarNav } from '@/components/sidebar-nav';
import { sqlRaw } from '@/db';

export const dynamic = 'force-dynamic';

async function getReportData() {
  let allInvoices: any[] = [];
  let allClients: any[] = [];
  let allLeads: any[] = [];
  let allTasks: any[] = [];

  try {
    allInvoices = await sqlRaw`SELECT * FROM invoices ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching invoices:', e);
  }

  try {
    allClients = await sqlRaw`SELECT * FROM clients ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching clients:', e);
  }

  try {
    allLeads = await sqlRaw`SELECT * FROM leads ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching leads:', e);
  }

  try {
    allTasks = await sqlRaw`SELECT * FROM tasks ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }

  // Calculate invoice stats
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = allInvoices.filter(inv => inv.status === 'sent').length;
  const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue').length;

  // Calculate lead stats
  const newLeads = allLeads.filter(l => l.status === 'new').length;
  const convertedLeads = allLeads.filter(l => l.status === 'converted').length;
  const contactedLeads = allLeads.filter(l => l.status === 'contacted').length;

  // Calculate task stats
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in-progress').length;

  // Calculate client stats
  const activeClients = allClients.filter(c => c.status === 'active').length;
  const inactiveClients = allClients.filter(c => c.status === 'inactive').length;

  return {
    // Stats
    totalRevenue,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    newLeads,
    convertedLeads,
    contactedLeads,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    activeClients,
    inactiveClients,
    totalInvoices: allInvoices.length,
    totalClients: allClients.length,
    totalLeads: allLeads.length,
    totalTasks: allTasks.length,
    // Raw data for rendering
    invoices: allInvoices,
    clients: allClients,
  };
}

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canViewInvoices = isAdmin;

  const data = await getReportData();

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/reports" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2A26' }}>Reports</h1>
            <p className="text-sm mb-8" style={{ color: '#9B9B8F' }}>View analytics and reports for your business</p>

            {/* Invoice Report - Only for admins */}
            {canViewInvoices && (
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Invoice Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Revenue</p>
                  <p className="text-2xl font-bold" style={{ color: '#81B29A' }}>KES {data.totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Paid</p>
                  <p className="text-2xl font-bold" style={{ color: '#81B29A' }}>{data.paidInvoices}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Pending</p>
                  <p className="text-2xl font-bold" style={{ color: '#B8923D' }}>{data.pendingInvoices}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Overdue</p>
                  <p className="text-2xl font-bold" style={{ color: '#E07A5F' }}>{data.overdueInvoices}</p>
                </div>
              </div>

              {data.totalInvoices > 0 && (
                <div className="overflow-hidden">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Client</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="font-medium">{invoice.invoiceNumber}</td>
                          <td style={{ color: '#9B9B8F' }}>{data.clients.find(c => c.id === invoice.clientId)?.name || 'N/A'}</td>
                          <td className="font-medium">KES {invoice.amount?.toLocaleString('en-KE') || '0.00'}</td>
                          <td>
                            <span className={`badge ${
                              invoice.status === 'paid' ? 'badge-completed' :
                              invoice.status === 'sent' ? 'badge-sent' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              'badge-pending'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td style={{ color: '#9B9B8F' }}>
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}

            {/* Lead Report */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Lead Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Leads</p>
                  <p className="text-2xl font-bold" style={{ color: '#E07A5F' }}>{data.totalLeads}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>New</p>
                  <p className="text-2xl font-bold" style={{ color: '#E07A5F' }}>{data.newLeads}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Contacted</p>
                  <p className="text-2xl font-bold" style={{ color: '#B8923D' }}>{data.contactedLeads}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Converted</p>
                  <p className="text-2xl font-bold" style={{ color: '#81B29A' }}>{data.convertedLeads}</p>
                </div>
              </div>
            </div>

            {/* Client Report */}
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Client Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(61, 64,91, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Clients</p>
                  <p className="text-2xl font-bold" style={{ color: '#3D405B' }}>{data.totalClients}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Active</p>
                  <p className="text-2xl font-bold" style={{ color: '#81B29A' }}>{data.activeClients}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(155, 155, 143, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Inactive</p>
                  <p className="text-2xl font-bold" style={{ color: '#9B9B8F' }}>{data.inactiveClients}</p>
                </div>
              </div>
            </div>

            {/* Task Report */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Task Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Total Tasks</p>
                  <p className="text-2xl font-bold" style={{ color: '#3D405B' }}>{data.totalTasks}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>Completed</p>
                  <p className="text-2xl font-bold" style={{ color: '#81B29A' }}>{data.completedTasks}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>In Progress</p>
                  <p className="text-2xl font-bold" style={{ color: '#B8923D' }}>{data.inProgressTasks}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}