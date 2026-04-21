import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq, desc, sql, or } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { DashboardCalendar } from './calendar';
import { ActivityFeed } from './activity-feed';

export const dynamic = 'force-dynamic';

async function getStats() {
  const allClients = await db.select().from(schema.clients).all();
  const allLeads = await db.select().from(schema.leads).all();
  const allInvoices = await db.select().from(schema.invoices).all();
  const allTasksFull = await db.select().from(schema.tasks).all();
  const pendingTasksList = await db.select().from(schema.tasks).where(eq(schema.tasks.status, 'pending')).orderBy(schema.tasks.dueDate).limit(5).all();

  const recentLeads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(5).all();
  const recentInvoices = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt)).limit(5).all();
  const recentTasks = await db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt)).limit(5).all();
  
  // Get client names for tasks
  const clientMap = new Map(allClients.map(c => [c.id, c]));
  const tasksWithClients = allTasksFull.map(task => ({
    ...task,
    clientName: task.clientId ? clientMap.get(task.clientId)?.name || null : null,
  }));

  return {
    clientCount: allClients.length,
    leadCount: allLeads.length,
    invoiceCount: allInvoices.length,
    taskCount: allTasksFull.length,
    allTasks: tasksWithClients,
    pendingTasks: pendingTasksList,
    recentLeads,
    recentInvoices,
    recentTasks,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const stats = await getStats();
  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      {/* Top Navigation */}
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/dashboard" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2A26' }}>Dashboard</h1>
            <p className="text-sm mb-8" style={{ color: '#9B9B8F' }}>Welcome back! Here's what's happening with your business.</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link href="/clients" className="stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Clients</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(224, 122, 95, 0.15)' }}>
                    <svg className="w-5 h-5" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#E07A5F' }}>{stats.clientCount}</p>
              </Link>
              
              <Link href="/leads" className="stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Leads</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(129, 178, 154, 0.15)' }}>
                    <svg className="w-5 h-5" style={{ color: '#81B29A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#81B29A' }}>{stats.leadCount}</p>
              </Link>
              
              <Link href="/invoices" className="stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Invoices</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(61, 64, 91, 0.15)' }}>
                    <svg className="w-5 h-5" style={{ color: '#3D405B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#3D405B' }}>{stats.invoiceCount}</p>
              </Link>
              
              <Link href="/tasks" className="stat-card group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm" style={{ color: '#9B9B8F' }}>Total Tasks</span>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(242, 204, 143, 0.2)' }}>
                    <svg className="w-5 h-5" style={{ color: '#B8923D' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: '#B8923D' }}>{stats.taskCount}</p>
              </Link>
            </div>

          {/* Calendar */}
          <DashboardCalendar tasks={stats.allTasks} />

          {/* Activity Feed */}
          <ActivityFeed 
            recentLeads={stats.recentLeads} 
            recentTasks={stats.recentTasks}
            recentInvoices={stats.recentInvoices}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: '#2D2A26' }}>Recent Leads</h2>
                  <Link href="/leads" className="text-sm" style={{ color: '#E07A5F' }}>View all →</Link>
                </div>
                {stats.recentLeads.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>No leads yet. Add your first lead to get started!</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.recentLeads.map((lead) => (
                      <li key={lead.id} className="flex justify-between items-center" style={{ borderBottom: '1px solid #E8E4DD' }}>
                        <div className="py-3">
                          <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.name}</p>
                          <p className="text-sm" style={{ color: '#9B9B8F' }}>{lead.email}</p>
                        </div>
                        <span className={`badge ${
                          lead.status === 'new' ? 'badge-new' :
                          lead.status === 'contacted' ? 'badge-pending' :
                          lead.status === 'qualified' ? 'badge-sent' :
                          lead.status === 'converted' ? 'badge-completed' :
                          'badge-pending'
                        }`}>
                          {lead.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: '#2D2A26' }}>Pending Tasks</h2>
                  <Link href="/tasks" className="text-sm" style={{ color: '#E07A5F' }}>View all →</Link>
                </div>
                {stats.pendingTasks.length === 0 ? (
                  <p className="text-sm" style={{ color: '#9B9B8F' }}>No pending tasks. Great job!</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.pendingTasks.map((task) => (
                      <li key={task.id} className="flex justify-between items-center" style={{ borderBottom: '1px solid #E8E4DD' }}>
                        <div className="py-3">
                          <p className="font-medium" style={{ color: '#2D2A26' }}>{task.title}</p>
                          {task.dueDate && (
                            <p className="text-sm" style={{ color: '#9B9B8F' }}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`badge ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'badge-pending' :
                          task.priority === 'medium' ? 'badge-new' :
                          'badge-completed'
                        }`}>
                          {task.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="card p-6 mt-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <Link href="/clients/new" className="btn-primary">
                    + Add Client
                  </Link>
                  <Link href="/leads/new" className="btn-secondary">
                    + Add Lead
                  </Link>
                  <Link href="/invoices/new" className="btn-outline">
                    + Create Invoice
                  </Link>
                  <Link href="/tasks/new" className="btn-outline">
                    + Create Task
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}