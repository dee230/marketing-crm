import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SidebarNav } from '@/components/sidebar-nav';
import { TopNav } from '@/components/top-nav';
import { db, sqlRaw } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { DashboardCalendar } from './calendar';
import { ActivityFeed } from './activity-feed';

export const dynamic = 'force-dynamic';

async function getStats() {
  let allClients: any[] = [];
  let allLeads: any[] = [];
  let allInvoices: any[] = [];
  let allTasksFull: any[] = [];
  let pendingTasksList: any[] = [];
  let recentLeads: any[] = [];
  let recentInvoices: any[] = [];
  let recentTasks: any[] = [];

  try {
    allClients = await db.select().from(schema.clients);
  } catch (e) {
    console.error('Error fetching clients:', e);
  }

  try {
    allLeads = await db.select().from(schema.leads);
  } catch (e) {
    console.error('Error fetching leads:', e);
  }

  try {
    allInvoices = await db.select().from(schema.invoices);
  } catch (e) {
    console.error('Error fetching invoices:', e);
  }

  try {
    // Use raw SQL for tasks
    allTasksFull = await sqlRaw`SELECT * FROM tasks ORDER BY created_at DESC`;
  } catch (e) {
    console.error('Error fetching tasks:', e);
  }

  try {
    // Use raw SQL for pending tasks
    pendingTasksList = await sqlRaw`SELECT * FROM tasks WHERE status = 'pending' ORDER BY due_date NULLS LAST LIMIT 5`;
  } catch (e) {
    console.error('Error fetching pending tasks:', e);
  }

  try {
    recentLeads = await db.select().from(schema.leads).limit(5);
  } catch (e) {
    console.error('Error fetching recent leads:', e);
  }

  try {
    recentInvoices = await db.select().from(schema.invoices).limit(5);
  } catch (e) {
    console.error('Error fetching recent invoices:', e);
  }

  try {
    // Use raw SQL for recent tasks
    recentTasks = await sqlRaw`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5`;
  } catch (e) {
    console.error('Error fetching recent tasks:', e);
  }

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
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const stats = await getStats();
  const userRole = session.user.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <SidebarNav currentPath="/dashboard" userRole={userRole} />
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6" style={{ color: '#2D2A26' }}>Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <p className="text-sm mb-2" style={{ color: '#9B9B8F' }}>Total Clients</p>
                <p className="text-3xl font-bold" style={{ color: '#2D2A26' }}>{stats.clientCount}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm mb-2" style={{ color: '#9B9B8F' }}>Total Leads</p>
                <p className="text-3xl font-bold" style={{ color: '#2D2A26' }}>{stats.leadCount}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm mb-2" style={{ color: '#9B9B8F' }}>Total Invoices</p>
                <p className="text-3xl font-bold" style={{ color: '#2D2A26' }}>{stats.invoiceCount}</p>
              </div>
              <div className="card p-6">
                <p className="text-sm mb-2" style={{ color: '#9B9B8F' }}>Total Tasks</p>
                <p className="text-3xl font-bold" style={{ color: '#2D2A26' }}>{stats.taskCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Upcoming Tasks</h2>
                <DashboardCalendar tasks={stats.pendingTasks} />
              </div>

              {/* Activity */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#2D2A26' }}>Recent Activity</h2>
                <ActivityFeed recentTasks={stats.recentTasks} recentLeads={stats.recentLeads} recentInvoices={stats.recentInvoices} />
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <Link href="/clients" className="card p-4 text-center hover:shadow-lg transition-shadow">
                <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span style={{ color: '#2D2A26' }}>Clients</span>
              </Link>
              <Link href="/leads" className="card p-4 text-center hover:shadow-lg transition-shadow">
                <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span style={{ color: '#2D2A26' }}>Leads</span>
              </Link>
              <Link href="/invoices" className="card p-4 text-center hover:shadow-lg transition-shadow">
                <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span style={{ color: '#2D2A26' }}>Invoices</span>
              </Link>
              <Link href="/tasks" className="card p-4 text-center hover:shadow-lg transition-shadow">
                <svg className="w-8 h-8 mx-auto mb-2" style={{ color: '#E07A5F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span style={{ color: '#2D2A26' }}>Tasks</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}