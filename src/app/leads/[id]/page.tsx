import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { TopNav } from '@/components/top-nav';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { EditLeadForm } from './edit-lead';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLead(id: string) {
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).execute();
  return lead || null;
}

async function getClient(clientId: string | null) {
  if (!clientId) return null;
  const [client] = await db.select().from(schema.clients).where(eq(schema.clients.id, clientId)).execute();
  return client || null;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  if (!session) redirect('/sign-in');

  const lead = await getLead(id);
  if (!lead) notFound();

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const client = await getClient(lead.clientId);

  return (
    <div className="min-h-screen" style={{ background: '#FDFBF7' }}>
      <TopNav userRole={userRole} userEmail={session.user.email || ''} isAdmin={isAdmin} />

      <div className="flex">
        <aside className="w-64 min-h-screen" style={{ background: '#FFFFFF', borderRight: '1px solid #E8E4DD' }}>
          <nav className="mt-6 px-4 space-y-1">
            <Link href="/dashboard" className="sidebar-link">Dashboard</Link>
            <Link href="/clients" className="sidebar-link">Clients</Link>
            <Link href="/leads" className="sidebar-link" style={{ background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' }}>Leads</Link>
            <Link href="/invoices" className="sidebar-link">Invoices</Link>
            <Link href="/accounting/pending" className="sidebar-link">Accounting</Link>
            <Link href="/tasks" className="sidebar-link">Tasks</Link>
            <Link href="/reports" className="sidebar-link">Reports</Link>
            <Link href="/users" className="sidebar-link">Users</Link>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/leads" className="p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" style={{ color: '#9B9B8F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2D2A26' }}>{lead.name}</h1>
                <p className="text-sm" style={{ color: '#9B9B8F' }}>Lead Details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lead Info */}
              <div className="card p-6 md:col-span-2">
<div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-medium" style={{ color: '#9B9B8F' }}>Contact Information</h3>
                  <EditLeadForm lead={lead} isAdmin={isAdmin} />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs" style={{ color: '#9B9B8F' }}>Status</span>
                      <p>
                        <span className={`badge ${
                          lead.status === 'new' ? 'badge-new' :
                          lead.status === 'contacted' ? 'badge-pending' :
                          lead.status === 'qualified' ? 'badge-sent' :
                          lead.status === 'converted' ? 'badge-completed' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {lead.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: '#9B9B8F' }}>Source</span>
                      <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.source}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Email</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.email || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Phone</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.phone || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Company</span>
                    <p className="font-medium" style={{ color: '#2D2A26' }}>{lead.company || '-'}</p>
                  </div>

                  <div>
                    <span className="text-xs" style={{ color: '#9B9B8F' }}>Notes</span>
                    <p className="text-sm" style={{ color: '#2D2A26' }}>{lead.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Dates</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm" style={{ color: '#9B9B8F' }}>Created</span>
                      <span className="text-sm" style={{ color: '#2D2A26' }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    {lead.convertedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm" style={{ color: '#9B9B8F' }}>Converted</span>
                        <span className="text-sm" style={{ color: '#2D2A26' }}>
                          {new Date(lead.convertedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Client */}
                {client && (
                  <div className="card p-6">
                    <h3 className="text-sm font-medium mb-4" style={{ color: '#9B9B8F' }}>Linked Client</h3>
                    <Link href={`/clients/${encodeURIComponent(client.company || client.name)}`} style={{ color: '#E07A5F' }}>
                      {client.company || client.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Link href="/leads" className="text-sm" style={{ color: '#E07A5F' }}>← Back to Leads</Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}